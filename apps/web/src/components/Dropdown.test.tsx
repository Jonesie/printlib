import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dropdown from "./Dropdown";

const options = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
] as const;

describe("Dropdown", () => {
  it("shows the current selection and no menu until clicked", () => {
    render(<Dropdown value="a" options={[...options]} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Alpha/ })).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("opens the menu with every option on click", async () => {
    render(<Dropdown value="a" options={[...options]} onChange={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /Alpha/ }));
    expect(screen.getAllByText("Alpha")).toHaveLength(2); // trigger button + menu item
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("calls onChange and closes the menu when an option is picked", async () => {
    const onChange = vi.fn();
    render(<Dropdown value="a" options={[...options]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Alpha/ }));
    await userEvent.click(screen.getByText("Beta"));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("closes the menu on outside click without calling onChange", async () => {
    const onChange = vi.fn();
    render(
      <div>
        <Dropdown value="a" options={[...options]} onChange={onChange} />
        <button>outside</button>
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: /Alpha/ }));
    expect(screen.getByText("Beta")).toBeInTheDocument();
    await userEvent.click(screen.getByText("outside"));
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
