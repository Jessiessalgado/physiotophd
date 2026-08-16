import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Search, Moon, Globe, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. NAVBAR SUPERIOR */}
      <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-slate-800">Jessica Salgado</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Physiotherapist | Researcher</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#" className="text-blue-600 border-b-2 border-blue-600 pb-1">Home</a>
          <a href="#" className="hover:text-slate-900 transition">About</a>
          <a href="#" className="hover:text-slate-900 transition">Research</a>
          <a href="#" className="hover:text-slate-900 transition">Publications</a>
          <a href="#" className="hover:text-slate-900 transition">Blog</a>
          <a href="#" className="hover:text-slate-900 transition">Contact</a>
        </div>

        <div className="flex items-center space-x-4 text-slate-500">
          <button className="hover:text-slate-800"><Search size={18} /></button>
          <button className="hover:text-slate-800"><Moon size={18} /></button>
          <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-800">
            <Globe size={18} />
            <span className="text-xs font-semibold">EN</span>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="relative overflow-hidden bg-white px-6 py-16 md:py-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Bridging <br />
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Physiotherapy</span> <br />
            <span className="bg-gradient-to-r from-emerald-500 to-indigo-600 bg-clip-text text-transparent">and Technology</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
            Exploring innovative approaches in neurorehabilitation using virtual reality, biomechanics and digital health.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium shadow-md shadow-blue-200 hover:bg-blue-700 transition flex items-center space-x-2">
              <span>Explore Articles</span>
              <ArrowRight size={16} />
            </button>
            <button className="border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-full font-medium hover:bg-slate-50 transition">
              About Me
            </button>
          </div>
        </div>

        <div className="relative w-full aspect-video lg:aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl overflow-hidden shadow-xl border border-slate-200 flex items-center justify-center">
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
            Neurorehabilitation research laboratory
          </div>
          <span className="text-slate-400 text-sm font-medium">Imagens / Vetores do Layout</span>
        </div>
      </header>

      {/* 3. RESEARCH AREAS */}
      <section className="bg-white border-y border-slate-200 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8 overflow-x-auto py-2 pr-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">Research Areas</h2>
            {[
              "Neurorehabilitation", "Virtual Reality", "Biomechanics", 
              "Wearable Technology", "Robotics & Automation", "Motor Learning", "Pediatric Rehabilitation"
            ].map((area, index) => (
              <div key={index} className="flex items-center space-x-2 cursor-pointer group whitespace-nowrap">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition">{area}</span>
              </div>
            ))}
          </div>
          <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition ml-4 shrink-0">
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* 4. LATEST ARTICLES & BIO */}
      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <section className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Latest Articles</h2>
            <a href="#" className="text-sm font-semibold text-blue-600 hover:underline">View all</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Virtual Reality article", tag: "Virtual Reality", color: "bg-purple-100 text-purple-700" },
              { title: "Biomechanics article", tag: "Biomechanics", color: "bg-blue-100 text-blue-700" },
              { title: "Neurorehabilitation article", tag: "Neurorehabilitation", color: "bg-emerald-100 text-emerald-700" }
            ].map((art, i) => (
              <article key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md ${art.color}`}>{art.tag}</span>
                <h3 className="text-lg font-bold text-slate-800 hover:text-blue-600 cursor-pointer transition">{art.title}</h3>
                <p className="text-sm text-slate-500">Brief summary of the publication layout and highlights...</p>
              </article>
            ))}
          </div>
        </section>

        <aside>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24 text-center space-y-4">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto overflow-hidden flex items-center justify-center border-4 border-slate-100 shadow-inner">
              <span className="text-slate-400 text-xs font-semibold">Jessica Pic</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Hi, I'm Jessica.</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Physiotherapist passionate about neurorehabilitation, technology and evidence-based practice.
              </p>
            </div>
            <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition">
              Learn more about my journey
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}
