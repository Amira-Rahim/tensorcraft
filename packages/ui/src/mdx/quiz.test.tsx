import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Quiz } from "./quiz";

const options = [
  { text: "A 1D array of numbers" },
  { text: "A multi-dimensional array with GPU support", correct: true },
  { text: "A JavaScript object" },
];

describe("Quiz", () => {
  it("renders the question", () => {
    render(<Quiz question="What is a tensor?" options={options} />);
    expect(screen.getByText("What is a tensor?")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(<Quiz question="What is a tensor?" options={options} />);
    expect(screen.getByText("A 1D array of numbers")).toBeInTheDocument();
    expect(
      screen.getByText("A multi-dimensional array with GPU support"),
    ).toBeInTheDocument();
    expect(screen.getByText("A JavaScript object")).toBeInTheDocument();
  });

  it("shows 'Quick Check' heading", () => {
    render(<Quiz question="Test?" options={options} />);
    expect(screen.getByText("Quick Check")).toBeInTheDocument();
  });

  it("has a disabled Check Answer button initially", () => {
    render(<Quiz question="Test?" options={options} />);
    const button = screen.getByText("Check Answer");
    expect(button).toBeDisabled();
  });

  it("enables Check Answer after selecting an option", () => {
    render(<Quiz question="Test?" options={options} />);
    fireEvent.click(screen.getByText("A 1D array of numbers"));
    expect(screen.getByText("Check Answer")).not.toBeDisabled();
  });

  it("shows 'Correct!' for right answer", () => {
    render(<Quiz question="Test?" options={options} />);
    fireEvent.click(
      screen.getByText("A multi-dimensional array with GPU support"),
    );
    fireEvent.click(screen.getByText("Check Answer"));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("shows 'Not quite' and Retry for wrong answer", () => {
    render(<Quiz question="Test?" options={options} />);
    fireEvent.click(screen.getByText("A JavaScript object"));
    fireEvent.click(screen.getByText("Check Answer"));
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("resets on Retry click", () => {
    render(<Quiz question="Test?" options={options} />);
    fireEvent.click(screen.getByText("A JavaScript object"));
    fireEvent.click(screen.getByText("Check Answer"));
    fireEvent.click(screen.getByText("Retry"));
    expect(screen.getByText("Check Answer")).toBeDisabled();
    expect(screen.queryByText(/Not quite/)).not.toBeInTheDocument();
  });

  it("disables options after submission", () => {
    render(<Quiz question="Test?" options={options} />);
    fireEvent.click(screen.getByText("A 1D array of numbers"));
    fireEvent.click(screen.getByText("Check Answer"));
    // All option buttons should be disabled
    const buttons = screen.getAllByRole("button");
    const optionButtons = buttons.filter(
      (b) => !b.textContent?.includes("Retry"),
    );
    optionButtons.forEach((b) => expect(b).toBeDisabled());
  });
});
