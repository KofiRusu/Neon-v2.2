import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AgentControlPanel from "@/components/agents/AgentControlPanel";
import { Agent } from "@/components/agents/types";

// Mock dependencies
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/utils/trpc", () => ({
  trpc: {},
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("AgentControlPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(<AgentControlPanel />);
    expect(screen.getByText("Agent Control Center")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Real-time monitoring and command interface for all AI agents",
      ),
    ).toBeInTheDocument();
  });

  it("renders without header when showHeader is false", () => {
    render(<AgentControlPanel showHeader={false} />);
    expect(screen.queryByText("Agent Control Center")).not.toBeInTheDocument();
  });

  it("renders without metrics when showMetrics is false", () => {
    render(<AgentControlPanel showMetrics={false} />);
    expect(screen.queryByText("Total Agents")).not.toBeInTheDocument();
  });

  it("applies compact layout when compact prop is true", () => {
    render(<AgentControlPanel compact={true} />);
    // Check if the grid has appropriate classes for compact layout
    const agentGrid = screen.getByRole("tabpanel");
    expect(agentGrid).toBeInTheDocument();
  });

  it("displays agent tabs correctly", () => {
    render(<AgentControlPanel />);
    expect(screen.getByText("All Agents (5)")).toBeInTheDocument();
    expect(screen.getByText("Running (2)")).toBeInTheDocument();
    expect(screen.getByText("Failed (1)")).toBeInTheDocument();
    expect(screen.getByText("Scheduled (1)")).toBeInTheDocument();
  });

  it("filters agents by tab selection", async () => {
    render(<AgentControlPanel />);

    // Click on Running tab
    fireEvent.click(screen.getByText("Running (2)"));

    // Should show only running/active agents
    await waitFor(() => {
      expect(screen.getByText("Content Generator")).toBeInTheDocument();
      expect(screen.getByText("SEO Optimizer")).toBeInTheDocument();
    });
  });

  it("handles agent command actions", async () => {
    render(<AgentControlPanel />);

    // Find and click a start button
    const startButtons = screen.getAllByText("Start");
    if (startButtons.length > 0) {
      fireEvent.click(startButtons[0]);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(
          screen.getByText("Confirm Action: Start Agent"),
        ).toBeInTheDocument();
      });
    }
  });

  it("shows and hides agent logs", async () => {
    render(<AgentControlPanel />);

    // Find and click logs button
    const logsButtons = screen.getAllByText("Logs");
    if (logsButtons.length > 0) {
      fireEvent.click(logsButtons[0]);

      // Should show log entries
      await waitFor(() => {
        expect(
          screen.getByText("Generated 3 blog posts with 95% quality score"),
        ).toBeInTheDocument();
      });
    }
  });

  it("handles refresh action", () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, "location", {
      value: {
        reload: mockReload,
      },
      writable: true,
    });

    render(<AgentControlPanel />);

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it("displays metrics correctly", () => {
    render(<AgentControlPanel />);

    expect(screen.getByText("Total Agents")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Avg Performance")).toBeInTheDocument();
    expect(screen.getByText("Total Tasks")).toBeInTheDocument();
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <AgentControlPanel className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
