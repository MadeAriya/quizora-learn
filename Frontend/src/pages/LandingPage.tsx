import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FaBrain, 
    FaGraduationCap,
    FaArrowRight,
    FaFileAlt,
    FaPlayCircle,
    FaLayerGroup,
    FaVideo,
    FaMicrophone
} from 'react-icons/fa';
import { BsStars } from "react-icons/bs";

export default function LandingPage() {
    const { currentUser } = useAuth();

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 font-sans selection:bg-purple-200 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-purple-200">
            {/* Navigation */}
            <nav className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100/50 dark:border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <BsStars size={20} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">Quizora <span className="text-indigo-600 dark:text-indigo-400">Learn</span></span>
                    </div>
                    <div>
                        {currentUser ? (
                            <Link to="/dashboard" className="px-6 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-[0_4px_14px_0_rgb(79,70,229,0.39)]">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/signin" className="text-gray-600 dark:text-gray-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Sign In</Link>
                                <Link to="/signup" className="px-6 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transform">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 bg-gradient-to-b from-indigo-400 to-purple-300 blur-[120px] rounded-full mix-blend-multiply filter pointer-events-none"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-medium text-sm mb-8 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                            Quizora Learn 2.0 is Here
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-8">
                            Master Any Subject in <br className="hidden lg:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
                                Seconds, Not Hours.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            The all-in-one AI study partner for beginners. Turn your messy notes and long videos into perfect quizzes and flashcards instantly.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {currentUser ? (
                                <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-full bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
                                    Go to Dashboard <FaArrowRight size={14} />
                                </Link>
                            ) : (
                                <Link to="/signup" className="w-full sm:w-auto px-8 py-4 rounded-full bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
                                    Start Learning for Free <FaArrowRight size={14} />
                                </Link>
                            )}
                            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center gap-2 shadow-sm">
                                <FaPlayCircle className="text-indigo-600" size={20} /> Watch Demo
                            </button>
                        </div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500 font-medium">No credit card required • 100% Free to start</p>
                    </div>
                </div>
            </section>

            {/* Social Proof Bar */}
            <section className="py-10 border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase mb-8">Trusted by students from</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="text-2xl font-black font-serif text-gray-800 dark:text-gray-300 tracking-tighter">Stanford</div>
                        <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-300 tracking-tight flex items-center gap-1"><FaGraduationCap/> HARVARD</div>
                        <div className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-300">MIT</div>
                        <div className="text-2xl font-semibold italic text-gray-800 dark:text-gray-300">Coursera</div>
                        <div className="text-2xl font-black text-gray-800 dark:text-gray-300">Udemy</div>
                    </div>
                </div>
            </section>

            {/* How It Works (3-Step Process) */}
            <section className="py-24 relative bg-[#fafafa] dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">How it Works</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400">Say goodbye to hours of making flashcards. Let the AI do the heavy lifting in three simple steps.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[45px] left-[10%] w-[80%] h-0.5 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 dark:from-indigo-900/50 dark:via-purple-900/50 dark:to-indigo-900/50"></div>

                        {/* Step 1 */}
                        <div className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 z-10 text-center group hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                <span className="text-2xl font-black">1</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Upload</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Drag and drop any file—PDFs, YouTube links, or voice recordings. We handle any format.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 z-10 text-center group hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                                <span className="text-2xl font-black">2</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Transform</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Our AI extracts the core concepts, simplifies them, and builds your personalized study kit instantly.</p>
                            <img src="/images/mascot.png" alt="Quizora Mascot" className="absolute -top-12 -right-6 w-24 h-24 hover:rotate-12 transition-transform drop-shadow-lg" />
                        </div>

                        {/* Step 3 */}
                        <div className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 z-10 text-center group hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                <span className="text-2xl font-black">3</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ace It</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Practice with AI-generated quizzes, review smart flashcards, and track your progress to mastery.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Feature Grid */}
            <section className="py-24 bg-white dark:bg-gray-900 relative">
                <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-b from-indigo-50/50 to-white/50 dark:from-indigo-950/20 dark:to-gray-900/50 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <span className="text-purple-600 dark:text-purple-400 font-bold tracking-wider uppercase text-sm">Features</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2 mb-6">Everything you need to learn faster.</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-white dark:bg-gray-800/50 p-10 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] transition-shadow">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                                <FaBrain size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Interactive Quizzes</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Gamified testing designed to help information stick. Challenge yourself with multiple-choice, true/false, and open-ended questions.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white dark:bg-gray-800/50 p-10 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] transition-shadow">
                            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                <FaLayerGroup size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Smart Flashcards</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Spaced-repetition flashcards generated automatically from your content. Review at the perfect time and never forget key terms.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white dark:bg-gray-800/50 p-10 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] transition-shadow">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                                <BsStars size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Beginner-Friendly Summaries</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Complex topics broken down into "Explain Like I'm 5" (ELI5) snapshots. Instantly grasp difficult concepts without the headache.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white dark:bg-gray-800/50 p-10 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] transition-shadow">
                            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                <FaFileAlt size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Multi-Format Support</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Whether it's a 2-hour YouTube lecture, a dense 50-page PDF, or scanned handwritten notes—Quizora understands it all.</p>
                            <div className="flex gap-4 mt-6 text-gray-400">
                                <FaVideo size={20} title="YouTube" className="hover:text-red-500 transition-colors cursor-help" />
                                <FaFileAlt size={20} title="PDF & Docs" className="hover:text-blue-500 transition-colors cursor-help" />
                                <FaMicrophone size={20} title="Audio" className="hover:text-purple-500 transition-colors cursor-help" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials / Personas */}
            <section className="py-24 bg-[#fafafa] dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">Loved by learners everywhere.</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Persona 1 */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 relative pt-14 text-center sm:text-left">
                            <div className="absolute -top-6 left-1/2 sm:left-8 -translate-x-1/2 sm:translate-x-0 w-16 h-16 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold">JD</div>
                            <div className="flex justify-center sm:justify-start gap-1 text-yellow-400 mb-4">
                                ★★★★★
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-6">"As a self-taught coder, navigating dense documentation was a nightmare. Quizora turns dry API docs into interactive quizzes. It saved me hours of anxiety."</p>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">John D.</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Self-Taught Coder</p>
                            </div>
                        </div>

                        {/* Persona 2 */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 relative pt-14 text-center sm:text-left">
                            <div className="absolute -top-6 left-1/2 sm:left-8 -translate-x-1/2 sm:translate-x-0 w-16 h-16 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold">SM</div>
                            <div className="flex justify-center sm:justify-start gap-1 text-yellow-400 mb-4">
                                ★★★★★
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-6">"My AP History lectures were 2 hours long on YouTube. Quizora generated 50 flashcards and a perfect summary in 10 seconds. My grades skyrocketed."</p>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">Sarah M.</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">High School Student</p>
                            </div>
                        </div>

                        {/* Persona 3 */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 relative pt-14 text-center sm:text-left">
                            <div className="absolute -top-6 left-1/2 sm:left-8 -translate-x-1/2 sm:translate-x-0 w-16 h-16 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold">RJ</div>
                            <div className="flex justify-center sm:justify-start gap-1 text-yellow-400 mb-4">
                                ★★★★★
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-6">"I read a lot of non-fiction books for personal growth. I upload chapter summaries into Quizora, and the quizzes ensure I actually remember what I read."</p>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">Robert J.</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Lifelong Learner</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">Why switch to Quizora?</h2>
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="grid grid-cols-3 bg-gray-50/80 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-6 font-bold text-gray-900 dark:text-white text-sm sm:text-lg text-center">
                            <div className="text-left flex items-center">Feature</div>
                            <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center">Traditional Studying</div>
                            <div className="text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2"><BsStars className="hidden sm:block"/> Quizora Learn</div>
                        </div>
                        
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 text-sm sm:text-base">
                            {[
                                { title: 'Time to Build Flashcards', trad: 'Hours of formatting', new: 'Instantly generated (Seconds)' },
                                { title: 'Engagement Level', trad: 'Passive Reading', new: 'Active Recall & Testing' },
                                { title: 'Breakdown of Concepts', trad: 'Dense & Confusing', new: 'ELI5 (Explain Like I\'m 5) Summaries' },
                                { title: 'Cost per hour', trad: 'High (Tutors & Courses)', new: 'Practically Free' },
                            ].map((row, idx) => (
                                <div key={idx} className="grid grid-cols-3 p-4 sm:p-6 items-center text-center hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="text-left font-semibold text-gray-900 dark:text-white pr-2">{row.title}</div>
                                    <div className="text-gray-500 dark:text-gray-400 px-2">{row.trad}</div>
                                    <div className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-500/10 py-2 rounded-lg px-2">{row.new}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA / Footer */}
            <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-gray-900 to-purple-900 opacity-50"></div>
                
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <img src="/images/mascot.png" alt="Quizora Mascot" className="w-24 h-24 mx-auto mb-8 bg-white/10 p-2 rounded-full border border-white/20 shadow-xl" />
                    <h2 className="text-5xl font-extrabold mb-6 tracking-tight">Ready to upgrade your brain?</h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Join thousands of learners building their future with Quizora Learn. Stop wasting time and start mastering your subjects.
                    </p>
                    {currentUser ? (
                        <Link to="/dashboard" className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-gray-900 font-bold text-lg hover:bg-indigo-50 hover:scale-105 transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)]">
                            Go to Dashboard <FaArrowRight />
                        </Link>
                    ) : (
                        <Link to="/signup" className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-gray-900 font-bold text-lg hover:bg-indigo-50 hover:scale-105 transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)]">
                            Create My First Study Guide <FaArrowRight />
                        </Link>
                    )}
                </div>
            </section>

            <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <BsStars className="text-indigo-400" size={20} />
                            <span className="font-bold text-xl tracking-tight">Quizora Learn</span>
                        </div>
                        <p className="text-sm max-w-sm">The all-in-one AI study partner for beginners. Transforming the way you learn, one feature at a time.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Use Cases</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-sm text-center">
                    &copy; {new Date().getFullYear()} Quizora Learn. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
