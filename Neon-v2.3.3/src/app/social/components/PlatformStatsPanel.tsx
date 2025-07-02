'use client';

interface PlatformStatsPanelProps {
  selectedPlatform: string;
}

interface PlatformStats {
  platform: string;
  followers: number;
  engagement: number;
  posts: number;
  reach: number;
  color: string;
}

export function PlatformStatsPanel({ selectedPlatform }: PlatformStatsPanelProps): JSX.Element {
  // Mock data - in a real app, this would come from your APIs
  const platformStats: PlatformStats[] = [
    {
      platform: 'instagram',
      followers: 12500,
      engagement: 4.2,
      posts: 145,
      reach: 28400,
      color: 'pink',
    },
    {
      platform: 'twitter',
      followers: 8200,
      engagement: 3.1,
      posts: 324,
      reach: 15600,
      color: 'blue',
    },
    {
      platform: 'linkedin',
      followers: 3400,
      engagement: 5.8,
      posts: 87,
      reach: 9200,
      color: 'blue',
    },
    {
      platform: 'facebook',
      followers: 6700,
      engagement: 2.9,
      posts: 156,
      reach: 12300,
      color: 'blue',
    },
  ];

  const getFilteredStats = (): PlatformStats[] => {
    if (selectedPlatform === 'all') {
      return platformStats;
    }
    return platformStats.filter(stat => stat.platform === selectedPlatform);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getTotalStats = (): {
    followers: number;
    engagement: number;
    posts: number;
    reach: number;
  } => {
    return platformStats.reduce(
      (acc, stat) => ({
        followers: acc.followers + stat.followers,
        engagement: acc.engagement + stat.engagement,
        posts: acc.posts + stat.posts,
        reach: acc.reach + stat.reach,
      }),
      { followers: 0, engagement: 0, posts: 0, reach: 0 }
    );
  };

  const stats = selectedPlatform === 'all' ? [getTotalStats()] : getFilteredStats();

  return (
    <div className="space-y-4">
      {selectedPlatform === 'all' ? (
        // Show aggregated stats for all platforms
        <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
          <h3 className="text-lg font-medium text-neutral-200 mb-4">Overall Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats[0].followers)}
              </div>
              <div className="text-sm text-neutral-400">Total Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {(stats[0].engagement / platformStats.length).toFixed(1)}%
              </div>
              <div className="text-sm text-neutral-400">Avg Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{formatNumber(stats[0].posts)}</div>
              <div className="text-sm text-neutral-400">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{formatNumber(stats[0].reach)}</div>
              <div className="text-sm text-neutral-400">Total Reach</div>
            </div>
          </div>
        </div>
      ) : (
        // Show specific platform stats
        getFilteredStats().map(stat => (
          <div
            key={stat.platform}
            className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800"
          >
            <h3 className="text-lg font-medium text-neutral-200 mb-4 capitalize">
              {stat.platform} Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Followers</span>
                <span className="text-white font-semibold">{formatNumber(stat.followers)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Engagement Rate</span>
                <span className="text-green-400 font-semibold">{stat.engagement}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Posts</span>
                <span className="text-white font-semibold">{stat.posts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Reach</span>
                <span className="text-blue-400 font-semibold">{formatNumber(stat.reach)}</span>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Performance Trends */}
      <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
        <h3 className="text-lg font-medium text-neutral-200 mb-4">Performance Trends</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">This Week</span>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">↗</span>
              <span className="text-green-400 font-semibold">+12.5%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">This Month</span>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">↗</span>
              <span className="text-green-400 font-semibold">+8.3%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Last 3 Months</span>
            <div className="flex items-center space-x-2">
              <span className="text-red-400">↘</span>
              <span className="text-red-400 font-semibold">-2.1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
        <h3 className="text-lg font-medium text-neutral-200 mb-4">Top Performing Posts</h3>
        <div className="space-y-3">
          {[
            { title: 'Product Launch Announcement', engagement: '4.2K', platform: 'Instagram' },
            { title: 'Behind the Scenes Video', engagement: '3.8K', platform: 'Twitter' },
            { title: 'Customer Success Story', engagement: '2.9K', platform: 'LinkedIn' },
          ].map((post, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-neutral-200 text-sm font-medium">{post.title}</p>
                <p className="text-neutral-500 text-xs">{post.platform}</p>
              </div>
              <span className="text-blue-400 font-semibold text-sm">{post.engagement}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
