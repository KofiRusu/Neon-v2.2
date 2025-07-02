import {
  Agent,
  LogEntry,
  AgentStatus,
  AgentCommand,
  LogLevel,
  TabFilter,
  AgentControlPanelProps,
  AgentControlWidgetProps,
  AgentCardProps,
  AgentMetrics,
  StatusConfig,
  LogConfig,
  AgentSchedule,
  AgentTypes,
} from "@/components/agents/types";

describe("Agent Types", () => {
  it("should have correct AgentStatus values", () => {
    const validStatuses: AgentStatus[] = [
      "active",
      "running",
      "idle",
      "error",
      "scheduled",
      "stopped",
    ];

    validStatuses.forEach((status) => {
      expect([
        "active",
        "running",
        "idle",
        "error",
        "scheduled",
        "stopped",
      ]).toContain(status);
    });
  });

  it("should have correct LogLevel values", () => {
    const validLogLevels: LogLevel[] = ["info", "success", "warning", "error"];

    validLogLevels.forEach((level) => {
      expect(["info", "success", "warning", "error"]).toContain(level);
    });
  });

  it("should have correct AgentCommand values", () => {
    const validCommands: AgentCommand[] = ["start", "stop", "debug"];

    validCommands.forEach((command) => {
      expect(["start", "stop", "debug"]).toContain(command);
    });
  });

  it("should have correct TabFilter values", () => {
    const validFilters: TabFilter[] = ["all", "running", "failed", "scheduled"];

    validFilters.forEach((filter) => {
      expect(["all", "running", "failed", "scheduled"]).toContain(filter);
    });
  });

  it("should create valid LogEntry object", () => {
    const logEntry: LogEntry = {
      id: "test-log-001",
      timestamp: "2024-01-01T12:00:00Z",
      level: "info",
      message: "Test log message",
      details: { key: "value" },
    };

    expect(logEntry.id).toBe("test-log-001");
    expect(logEntry.level).toBe("info");
    expect(logEntry.message).toBe("Test log message");
    expect(logEntry.details).toEqual({ key: "value" });
  });

  it("should create valid AgentSchedule object", () => {
    const schedule: AgentSchedule = {
      pattern: "Every 2 hours",
      nextRun: "2024-01-01T14:00:00Z",
      interval: "PT2H",
    };

    expect(schedule.pattern).toBe("Every 2 hours");
    expect(schedule.nextRun).toBe("2024-01-01T14:00:00Z");
    expect(schedule.interval).toBe("PT2H");
  });

  it("should create valid Agent object", () => {
    const agent: Agent = {
      id: "test-agent-001",
      name: "Test Agent",
      type: "Test Type",
      status: "active",
      lastRun: "2024-01-01T12:00:00Z",
      tasksCompleted: 100,
      tasksActive: 2,
      successRate: 95.5,
      performance: 90,
      cpuUsage: 50,
      memoryUsage: 60,
      uptime: "99.9%",
      version: "v1.0.0",
      description: "Test agent description",
      capabilities: ["test1", "test2"],
      icon: "🤖",
      logs: [],
      schedule: {
        pattern: "Daily",
        nextRun: "2024-01-02T12:00:00Z",
        interval: "P1D",
      },
    };

    expect(agent.id).toBe("test-agent-001");
    expect(agent.status).toBe("active");
    expect(agent.tasksCompleted).toBe(100);
    expect(agent.capabilities).toEqual(["test1", "test2"]);
    expect(agent.schedule?.pattern).toBe("Daily");
  });

  it("should create valid AgentControlPanelProps object", () => {
    const props: AgentControlPanelProps = {
      className: "test-class",
      showHeader: true,
      showMetrics: false,
      compact: true,
    };

    expect(props.className).toBe("test-class");
    expect(props.showHeader).toBe(true);
    expect(props.showMetrics).toBe(false);
    expect(props.compact).toBe(true);
  });

  it("should create valid AgentControlWidgetProps object", () => {
    const props: AgentControlWidgetProps = {
      className: "widget-class",
    };

    expect(props.className).toBe("widget-class");
  });

  it("should create valid AgentMetrics object", () => {
    const metrics: AgentMetrics = {
      total: 10,
      active: 5,
      failed: 1,
      scheduled: 2,
      avgPerformance: 85,
      totalTasks: 1000,
      avgSuccessRate: 92,
    };

    expect(metrics.total).toBe(10);
    expect(metrics.active).toBe(5);
    expect(metrics.avgPerformance).toBe(85);
    expect(metrics.totalTasks).toBe(1000);
  });

  it("should have AgentTypes constant available", () => {
    expect(AgentTypes).toBeDefined();
    expect(typeof AgentTypes).toBe("object");
  });

  it("should validate StatusConfig structure", () => {
    const statusConfig: StatusConfig = {
      color: "text-green-400",
      bg: "bg-green-400/20",
      border: "border-green-400/30",
      icon: "MockIcon",
      pulse: "animate-pulse",
    };

    expect(statusConfig.color).toBe("text-green-400");
    expect(statusConfig.bg).toBe("bg-green-400/20");
    expect(statusConfig.border).toBe("border-green-400/30");
    expect(statusConfig.pulse).toBe("animate-pulse");
  });

  it("should validate LogConfig structure", () => {
    const logConfig: LogConfig = {
      color: "text-blue-400",
      icon: "MockIcon",
      bg: "bg-blue-400/10",
    };

    expect(logConfig.color).toBe("text-blue-400");
    expect(logConfig.bg).toBe("bg-blue-400/10");
  });
});
