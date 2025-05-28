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
    expect(
      screen.getByText(/In a world where every second counts/i)
    ).toBeInTheDocument();
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
    fireEvent.change(
      screen.getByPlaceholderText("Please enter your link here"),
      {
        target: { value: "https://example.com" },
      }
    );
    fireEvent.change(screen.getAllByPlaceholderText("Input alias")[0], {
      target: { value: "custom-alias" },
    });

    fireEvent.click(screen.getByText("Reduce!"));

    await screen.findByText(
      "This alias is already taken. Please choose another one."
    );
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
    fireEvent.change(
      screen.getByPlaceholderText("Please enter your link here"),
      {
        target: { value: "https://example.com" },
      }
    );

    fireEvent.click(screen.getByText("Reduce!"));

    await screen.findByText("https://tls.ru/test123");

    fireEvent.click(screen.getByText("Copy"));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://tls.ru/test123"
    );
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });

  test("tabs switch correctly", () => {
    render(<App />);

    fireEvent.click(screen.getByText("Delete"));
    expect(
      screen.getAllByPlaceholderText("Input alias")[0]
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Edit"));
    expect(
      screen.getByPlaceholderText("Input exist alias")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Redirect"));
    expect(
      screen.getAllByPlaceholderText("Input alias")[1]
    ).toBeInTheDocument();
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
    expect(
      screen.getByText("Please enter both current and new alias")
    ).toBeInTheDocument();
  });

  test("redirects to the correct URL on successful fetch", async () => {
    const mockUrl = "https://example.com ";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: mockUrl }),
    });

    render(<App />);
    fireEvent.click(screen.getAllByText("Redirect")[0]);
    const input = screen.getAllByPlaceholderText("Input alias")[1];
    fireEvent.change(input, { target: { value: "abc123" } });

    const redirectButton = screen.getAllByText("Redirect")[1];
    fireEvent.click(redirectButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://158.160.134.110:8080/abc123",
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  test("shows error when redirect returns no URL", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<App />);
    fireEvent.click(screen.getAllByText("Redirect")[0]);
    const input = screen.getAllByPlaceholderText("Input alias")[1];
    fireEvent.change(input, { target: { value: "abc123" } });
    fireEvent.click(screen.getAllByText("Redirect")[1]);

    await screen.findByText("No redirect URL found in response");
  });

  test("shows error when new alias is same as current", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 400,
      text: async () => "New alias must be different",
    });

    render(<App />);
    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.change(screen.getByPlaceholderText("Input exist alias"), {
      target: { value: "old-alias" },
    });
    fireEvent.change(screen.getByPlaceholderText("Input new alias"), {
      target: { value: "old-alias" },
    });
    fireEvent.click(screen.getByText("Update"));

    await screen.findByText("New alias must be different");
  });

  test("shows error when current alias not found during edit", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 404,
      text: async () => "Alias not found",
    });

    render(<App />);
    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.change(screen.getByPlaceholderText("Input exist alias"), {
      target: { value: "old-alias" },
    });
    fireEvent.change(screen.getByPlaceholderText("Input new alias"), {
      target: { value: "new-alias" },
    });
    fireEvent.click(screen.getByText("Update"));

    await screen.findByText('Alias "old-alias" not found');
  });

  test("shows error when new alias already exists", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 409,
      text: async () => "Alias already exists",
    });

    render(<App />);
    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.change(screen.getByPlaceholderText("Input exist alias"), {
      target: { value: "old-alias" },
    });
    fireEvent.change(screen.getByPlaceholderText("Input new alias"), {
      target: { value: "new-alias" },
    });
    fireEvent.click(screen.getByText("Update"));

    await screen.findByText('Alias "new-alias" already exists');
  });

  test("shows server error during edit", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      text: async () => "Server error",
    });

    render(<App />);
    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.change(screen.getByPlaceholderText("Input exist alias"), {
      target: { value: "old-alias" },
    });
    fireEvent.change(screen.getByPlaceholderText("Input new alias"), {
      target: { value: "new-alias" },
    });
    fireEvent.click(screen.getByText("Update"));

    await screen.findByText("Alias update problem. Please try again later.");
  });

  test("successfully edits alias", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({}),
    });

    render(<App />);

    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.change(screen.getByPlaceholderText("Input exist alias"), {
      target: { value: "old-alias" },
    });
    fireEvent.change(screen.getByPlaceholderText("Input new alias"), {
      target: { value: "new-alias" },
    });
    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Alias changed from "old-alias" to "new-alias" successfully!'
        )
      ).toBeInTheDocument();
    });
  });

  test("successfully deletes alias", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    });

    render(<App />);

    fireEvent.click(screen.getAllByText("Delete")[0]);
    const input = screen.getAllByPlaceholderText("Input alias")[1];
    fireEvent.change(input, { target: { value: "delete-me" } });

    fireEvent.click(screen.getAllByText("Delete")[1]);

    await screen.findByText('Alias "delete-me" deleted successfully!');
  });

  test("shows error when alias not found during delete", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 404,
    text: async () => "Alias not found",
  });

  render(<App />);
  
  fireEvent.click(screen.getAllByText("Delete")[0]); 
  fireEvent.change(screen.getAllByPlaceholderText("Input alias")[1], {
    target: { value: "delete-me" },
  });
  fireEvent.click(screen.getAllByText("Delete")[1]); 

  await screen.findByText('Alias "delete-me" not found');
});

  test("shows server error during delete", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 500,
    text: async () => "Server error",
  });

  render(<App />);
  
  fireEvent.click(screen.getAllByText("Delete")[0]);
  fireEvent.change(screen.getAllByPlaceholderText("Input alias")[1], {
    target: { value: "delete-me" },
  });
  fireEvent.click(screen.getAllByText("Delete")[1]);

  await screen.findByText("Alias deletion problem. Please try again later.");
});

  test("shows error for invalid URL format", async () => {
    render(<App />);
    const urlInput = screen.getByPlaceholderText("Please enter your link here");
    fireEvent.change(urlInput, { target: { value: "invalid-url" } });
    fireEvent.click(screen.getByText("Reduce!"));

    expect(
      await screen.findByText("Please enter the correct link!")
    ).toBeInTheDocument();
  });


  test("handles network error in handleEditSubmit", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    render(<App />);
    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.change(screen.getByPlaceholderText("Input exist alias"), {
      target: { value: "old-alias" },
    });
    fireEvent.change(screen.getByPlaceholderText("Input new alias"), {
      target: { value: "new-alias" },
    });
    fireEvent.click(screen.getByText("Update"));

    await screen.findByText("Network error. Please check your connection.");
  });

  test("handles network error in handleDelete", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    render(<App />);

    fireEvent.click(screen.getAllByText("Delete")[0]);
    fireEvent.change(screen.getAllByPlaceholderText("Input alias")[1], {
      target: { value: "delete-me" },
    });
    fireEvent.click(screen.getAllByText("Delete")[1]);

    await screen.findByText("Network error. Please check your connection.");
  });
});
