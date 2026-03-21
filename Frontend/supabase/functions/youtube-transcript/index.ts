import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { link, user_id } = await req.json()

    if (!link) {
      throw new Error('No YouTube link provided')
    }

    console.log(`Fetching transcript for: ${link}`)

    // 1. Get the video page HTML with a browser User-Agent
    const response = await fetch(link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      }
    })
    const html = await response.text()

    // 2. Extract the captions data from the page source
    // Method A: Look for ytInitialPlayerResponse variable
    let captionsJson: any = null
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/s) ||
                          html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/s)
    
    if (playerResponseMatch) {
      try {
        const playerResponse = JSON.parse(playerResponseMatch[1])
        captionsJson = playerResponse.captions
      } catch (e) {
        console.error('Failed to parse ytInitialPlayerResponse JSON')
      }
    }

    // Method B: Fallback to direct "captions" match
    if (!captionsJson) {
      const captionsMatch = html.match(/"captions":\s*({.*?}),\s*"videoDetails"/s)
      if (captionsMatch) {
         try {
           captionsJson = JSON.parse(captionsMatch[1])
         } catch (e) {
           console.error('Failed to parse direct captions JSON')
         }
      }
    }
    
    if (!captionsJson) {
      // For debugging: log a small portion of the HTML to see where we might be failing
      console.log('HTML sample (first 1000 chars):', html.substring(0, 1000))
      throw new Error('Could not find captions in the YouTube page. The video might not have captions/transcripts enabled or the page structure has changed.')
    }

    const captionTracks = captionsJson.playerCaptionsTracklistRenderer?.captionTracks

    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No caption tracks found for this video.')
    }

    // Prefer English, then Indonesian, then the first available track
    const preferredLanguages = ['en', 'id']
    let selectedTrack = captionTracks[0]

    for (const lang of preferredLanguages) {
      const track = captionTracks.find((t: any) => t.languageCode === lang)
      if (track) {
        selectedTrack = track
        break
      }
    }

    console.log(`Using track language: ${selectedTrack.languageCode}`)

    // 3. Fetch the actual transcript XML/JSON
    const transcriptResponse = await fetch(selectedTrack.baseUrl + '&fmt=json3')
    const transcriptData = await transcriptResponse.json()

    // 4. Extract and clean the text segments
    const transcriptText = transcriptData.events
      ?.filter((event: any) => event.segs)
      ?.map((event: any) => 
        event.segs.map((seg: any) => seg.utf8 || '').join('')
      )
      ?.join(' ')
      ?.replace(/\s+/g, ' ')
      ?.replace(/&#39;/g, "'")
      ?.replace(/&quot;/g, '"')
      ?.trim()

    if (!transcriptText) {
      throw new Error('Failed to extract transcript text.')
    }

    console.log(`Extracted transcript length: ${transcriptText.length} characters`)

    // 5. Forward to n8n webhook
    const webhookUrl = "https://n8n.ayakdev.web.id/webhook/d21b3b4e-1ca4-4d3b-9dd3-3c583a90eedc"
    
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        link,
        transcript: transcriptText,
        source: 'supabase-edge-function'
      })
    })

    const n8nResult = await n8nResponse.text()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Transcript extracted and sent to webhook',
        n8n_response: n8nResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
