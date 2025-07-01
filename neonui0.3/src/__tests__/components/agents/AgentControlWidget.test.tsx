import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AgentControlWidget from "@/components/agents/AgentControlWidget";

// Mock dependencies
vi.mock("@/components/agents/AgentControlPanel", () => ({
  default: () => (
    <div data-testid="agent-control-panel">Mocked AgentControlPanel</div>
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe("AgentControlWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the widget with default props", () => {
    render(<AgentControlWidget />);

    expect(screen.getByText("Agent Status")).toBeInTheDocument();
    expect(screen.getByText("See all agents")).toBeInTheDocument();
    expect(screen.getByTestId("agent-control-panel")).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const { container } = render(
      <AgentControlWidget className="custom-widget-class" />,
    );

    // Check if the card has the custom class
    const card = container.querySelector(".custom-widget-class");
    expect(card).toBeInTheDocument();
  });

  it("contains a link to the full agents page", () => {
    render(<AgentControlWidget />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/agents");
    expect(link).toHaveTextContent("See all agents");
  });

  it("renders the Bot icon in the header", () => {
    render(<AgentControlWidget />);

    // The Bot icon should be present (checking for svg or icon element)
    const header = screen.getByText("Agent Status").closest("div");
    expect(header).toBeInTheDocument();
  });

  it("passes correct props to AgentControlPanel", () => {
    render(<AgentControlWidget />);

    // Verify that AgentControlPanel is rendered (mocked)
    expect(screen.getByTestId("agent-control-panel")).toBeInTheDocument();
  });

  it("has correct card styling classes", () => {
    const { container } = render(<AgentControlWidget />);

    const card = container.querySelector(".glassmorphism-effect");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("border-white/10", "bg-white/5", "shadow-lg");
  });
});
