export default function HomePage() {
  return (
    <div className="min-h-screen bg-neon-gradient flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white animate-gradient-shift bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan bg-clip-text text-transparent bg-300% animate-pulse">
            🚀 NeonHub UI Workspace
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Production-ready AI Marketing Platform Frontend
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-glass-light backdrop-blur-md rounded-full border border-neon-blue/20">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse mr-2"></div>
            <span className="text-neon-green font-medium">Initialized & Ready</span>
          </div>
        </div>

        {/* Quick Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {[
            { 
              name: '📊 Dashboard', 
              href: '/dashboard',
              description: 'AI Command Center',
              color: 'neon-blue'
            },
            { 
              name: '🤖 AI Agents', 
              href: '/agents',
              description: 'Agent Management',
              color: 'neon-purple'
            },
            { 
              name: '📢 Campaigns', 
              href: '/campaigns',
              description: 'Campaign Orchestration',
              color: 'neon-green'
            },
            { 
              name: '📈 Analytics', 
              href: '/analytics',
              description: 'Performance Metrics',
              color: 'neon-cyan'
            },
            { 
              name: '💬 Support', 
              href: '/support',
              description: 'WhatsApp & Tickets',
              color: 'neon-pink'
            },
            { 
              name: '⚙️ Settings', 
              href: '/settings',
              description: 'Configuration Hub',
              color: 'neon-yellow'
            }
          ].map((item) => (
            <a 
              key={item.name}
              href={item.href}
              className="group relative p-6 bg-glass-light backdrop-blur-md rounded-xl border border-white/10 hover:border-neon-blue/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/20"
            >
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-white group-hover:animate-neon-pulse">
                  {item.name}
                </div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {item.description}
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            </a>
          ))}
        </div>

        {/* Status Information */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-glass-dark backdrop-blur-md rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-neon-green">43</div>
            <div className="text-sm text-gray-400">UI Components</div>
          </div>
          <div className="text-center p-4 bg-glass-dark backdrop-blur-md rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-neon-blue">28</div>
            <div className="text-sm text-gray-400">App Routes</div>
          </div>
          <div className="text-center p-4 bg-glass-dark backdrop-blur-md rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-neon-purple">100%</div>
            <div className="text-sm text-gray-400">Production Ready</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>NeonHub v0.3 • Built with Next.js 15 + TypeScript + Tailwind CSS</p>
          <p className="mt-1">Monorepo Frontend Workspace</p>
        </div>
      </div>
    </div>
  );
}
