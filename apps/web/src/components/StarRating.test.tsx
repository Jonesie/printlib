import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRating from "./StarRating";

describe("StarRating", () => {
  it("renders nothing when read-only with no rating", () => {
    const { container } = render(<StarRating rating={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders 5 stars when read-only with a rating", () => {
    render(<StarRating rating={3} />);
    expect(screen.getAllByText("★")).toHaveLength(5);
  });

  it("renders 5 stars when editable even with no rating", () => {
    render(<StarRating rating={null} onChange={() => {}} />);
    expect(screen.getAllByText("★")).toHaveLength(5);
  });

  it("calls onChange with the clicked star's value", async () => {
    const onChange = vi.fn();
    render(<StarRating rating={null} onChange={onChange} />);
    await userEvent.click(screen.getByTitle("Rate 4 stars"));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("clicking the current rating clears it", async () => {
    const onChange = vi.fn();
    render(<StarRating rating={3} onChange={onChange} />);
    await userEvent.click(screen.getByTitle("Rate 3 stars"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("read-only stars are not clickable buttons", () => {
    render(<StarRating rating={3} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });
});
