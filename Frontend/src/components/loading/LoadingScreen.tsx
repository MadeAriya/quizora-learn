import { Atom } from 'react-loading-indicators'

export default function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-opacity-30 dark:bg-opacity-30 backdrop-blur-sm">
            <Atom color="#224dd8" size="large" text="Loading..." textColor="#224dd8" />
        </div>
    )
}