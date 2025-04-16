import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe("App", () => {
  test("renders title and description", () => {
    render(<App />);
    expect(screen.getByText("The Link Shortener")).toBeInTheDocument();
    expect(screen.getByText(/In a world where every second counts/i)).toBeInTheDocument();
  });

  test("shows error when clicking reduce without input", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Reduce!"));
    expect(await screen.findByText("Please enter a URL")).toBeInTheDocument();
  });

  test("shows new block after successful reduction", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ alias: "https://tls.ru/xyz123" }),
    });

    render(<App />);
    const urlInput = screen.getByPlaceholderText("Please enter your link here");
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("Reduce!"));

    await waitFor(() => {
      expect(screen.getByText("Copy")).toBeInTheDocument();
    });
    
  });

  test("shows error when alias already taken", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => "Alias conflict",
    });

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText("Please enter your link here"), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Input alias")[0], {
      target: { value: "custom-alias" },
    });
    
    fireEvent.click(screen.getByText("Reduce!"));

    await screen.findByText("This alias is already taken. Please choose another one.");
  });

  test("copy button copies text", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ alias: "https://tls.ru/test123" }),
    });
  
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    });
  
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText("Please enter your link here"), {
      target: { value: "https://example.com" },
    });
  
    fireEvent.click(screen.getByText("Reduce!"));
  
    await screen.findByText("https://tls.ru/test123");
  
    fireEvent.click(screen.getByText("Copy"));
  
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://tls.ru/test123");
    expect(await screen.findByText("Copied!")).toBeInTheDocument();

  });
  

  test("tabs switch correctly", () => {
    render(<App />);
  
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getAllByPlaceholderText("Input alias")[0]).toBeInTheDocument();
  
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByPlaceholderText("Input exist alias")).toBeInTheDocument();
  
    fireEvent.click(screen.getByText("Redirect"));
    expect(screen.getAllByPlaceholderText("Input alias")[1]).toBeInTheDocument();
  });
  

  test("shows error on empty redirect", () => {
    render(<App />);
    fireEvent.click(screen.getAllByText("Redirect")[0]);
    fireEvent.click(screen.getAllByText("Redirect")[1]);
    expect(screen.getByText("Please enter an alias")).toBeInTheDocument();
  });

  test("shows error on empty delete", () => {
    render(<App />);
    fireEvent.click(screen.getAllByText("Delete")[0]);
    fireEvent.click(screen.getAllByText("Delete")[1]);
    expect(screen.getByText("Please enter an alias")).toBeInTheDocument();
  });

  test("shows error on empty edit fields", () => {
    render(<App />);
    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.click(screen.getAllByText("Update")[0]);
    expect(screen.getByText("Please enter both current and new alias")).toBeInTheDocument();
  });
  
});
