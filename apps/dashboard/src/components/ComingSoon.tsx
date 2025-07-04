export default function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="glass-strong p-12 rounded-3xl text-center max-w-2xl">
        <div className="w-24 h-24 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center mx-auto mb-8 animate-glow-border">
          <span className="text-4xl">🚀</span>
        </div>

        <h1 className="text-4xl font-bold mb-4">
          <span className="text-neon-blue">{feature}</span>
        </h1>

        <p className="text-secondary text-lg mb-8 leading-relaxed">
          This feature is currently being integrated into the NeonHub ecosystem.
          Our AI agents are working around the clock to bring you the most
          advanced capabilities.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-secondary">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span>Development in Progress</span>
            </div>
            <div className="text-muted">•</div>
            <div>Coming Soon</div>
          </div>

          <div className="glass p-4 rounded-xl">
            <p className="text-sm text-muted">
              Want to be notified when this feature launches?
              <span className="text-neon-blue ml-1">
                Contact your account manager
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
