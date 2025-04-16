import "./App.css";
import { InputLink } from "./components/InputLink.jsx";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [inputAliasValue, setInputAliasValue] = useState("");
  const [inputAliasRedirect, setInputAliasRedirect] = useState("");
  const [inputAliasDelete, setInputAliasDelete] = useState("");
  const [inputAliasEdit, setInputAliasEdit] = useState("");
  const [newBlock, SetNewBlock] = useState(false);
  const [ErrorBlock, SetErrorBlock] = useState(false);
  const [ErrorBlockTwo, SetErrorBlockTwo] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorMessageTwo, setErrorMessageTwo] = useState("");
  const [reduceLink, setReduceLink] = useState("https://tls.ru/hK0A2");
  const [activeTab, setActiveTab] = useState("Redirect");
  const [editInput, setEditInput] = useState("");

  const handleCopyText = () => {
    navigator.clipboard
      .writeText(reduceLink)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000);
      })
      .catch((err) => console.error("Copy failed:", err));
  };

  const handleReduce = async () => {
    console.log("Starting URL shortening...");
  
    if (!inputValue.trim()) {
      console.log("Empty input");
      setErrorMessage("Please enter a URL");
      SetErrorBlock(true);
      return;
    }
  
    console.log("Input URL:", inputValue);
  
    try {
      console.log("Sending request to API...");
      
      const requestBody = {
        url: inputValue
      };
      
      if (inputAliasValue.trim()) {
        requestBody.alias = inputAliasValue.trim();
      }
  
      const response = await fetch("http://84.201.181.188:8080/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      console.log("Received response:", response);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        
        if (response.status === 409) {
          setErrorMessage("This alias is already taken. Please choose another one.");
        } else {
          setErrorMessage("Failed to shorten URL");
        }
        
        SetErrorBlock(true);
        return;
      }
  
      const data = await response.json();
      console.log("API response data:", data);
  
      setReduceLink(data.alias || "");
      SetNewBlock(true);
      SetErrorBlock(false);
      console.log("URL shortened successfully");
      
      setInputAliasValue("");
      
    } catch (error) {
      console.error("Request failed:", error);
      setErrorMessage("Network error, please try again");
      SetErrorBlock(true);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setEditInput("");
    setInputAliasEdit("");
    setInputAliasDelete("");
    setInputAliasRedirect("");
    SetErrorBlockTwo(false)
  };

  const handleEditSubmit = async () => {
    if (!editInput.trim() || !inputAliasEdit.trim()) {
      setErrorMessageTwo("Please enter both current and new alias");
      SetErrorBlockTwo(true);
      return;
    }
  
    try {
      const currentAlias = editInput;
      const newAlias = inputAliasEdit.trim();
  
      console.log(`Updating alias from ${currentAlias} to ${newAlias}`);
  
      const response = await fetch(`http://84.201.181.188:8080/url/${currentAlias}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newAlias: newAlias
        }),
      });

      if (response.status === 400) {
        setErrorMessageTwo(`New alias must be different`);
        SetErrorBlockTwo(true);
        return;
      }
  
      if (response.status === 404) {
        setErrorMessageTwo(`Alias "${currentAlias}" not found`);
        SetErrorBlockTwo(true);
        return;
      }
  
      if (response.status === 409) {
        setErrorMessageTwo(`Alias "${newAlias}" already exists`);
        SetErrorBlockTwo(true);
        return;
      }
  
      if (response.status === 500) {
        setErrorMessageTwo("Alias update problem. Please try again later.");
        SetErrorBlockTwo(true);
        return;
      }
  
      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessageTwo(errorText || "Failed to update alias");
        SetErrorBlockTwo(true);
        return;
      }
  
      const data = await response.json();
      console.log("Alias updated successfully:", data);
      
      setEditInput("");
      setInputAliasEdit("");
      setErrorMessageTwo(`Alias changed from "${currentAlias}" to "${newAlias}" successfully!`);
      SetErrorBlockTwo(true);
    
  
    } catch (error) {
      console.error("Edit failed:", error);
      setErrorMessageTwo("Network error. Please check your connection.");
      SetErrorBlockTwo(true);
    }
  };

  const handleDelete = async () => {
    if (!inputAliasDelete.trim()) {
      setErrorMessageTwo("Please enter an alias");
      SetErrorBlockTwo(true);
      return;
    }
  
    try {
      const alias = inputAliasDelete;
      console.log("Deleting alias:", alias);
  
      const response = await fetch(`http://84.201.181.188:8080/url/${alias}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.status === 404) {
        setErrorMessageTwo(`Alias "${alias}" not found`);
        SetErrorBlockTwo(true);
        return;
      }
  
      if (response.status === 500) {
        setErrorMessageTwo("Alias deletion problem. Please try again later.");
        SetErrorBlockTwo(true);
        return;
      }
  
      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessageTwo(errorText || "Failed to delete URL");
        SetErrorBlockTwo(true);
        return;
      }
  
      console.log("URL successfully deleted");
      setInputAliasDelete("");
      setErrorMessageTwo(`Alias "${alias}" deleted successfully!`);
      SetErrorBlockTwo(true);
  
  
    } catch (error) {
      console.error("Delete failed:", error);
      setErrorMessageTwo("Network error. Please check your connection.");
      SetErrorBlockTwo(true);
    }
  };

  const handleRedirect = async () => {
    if (!inputAliasRedirect.trim()) {
      setErrorMessageTwo("Please enter an alias");
      SetErrorBlockTwo(true);
      return;
    }

    try {
      const alias = inputAliasRedirect;
      console.log("Alias:", alias);

      const response = await fetch(`http://84.201.181.188:8080/${alias}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Response data:", data);

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No redirect URL found in response");
      }
    } catch (error) {
      console.error("Redirect failed:", error);
      setErrorMessageTwo(error.message || "Redirect error");
      SetErrorBlockTwo(true);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1 className="title">The Link Shortener</h1>
        <p className="title-text">
          In a world where every second counts, it's important to be concise.
          Our link shortening service will help you turn long and complex URLs
          into short and convenient ones.
        </p>

        <div className="input-block">
          <InputLink
            value={inputValue}
            onChange={setInputValue}
            placeholder={"Please enter your link here"}
          />
          <InputLink
            className="input_alias"
            value={inputAliasValue}
            onChange={setInputAliasValue}
            placeholder={"Input alias"}
          />
          <button className="button" onClick={handleReduce}>
            Reduce!
          </button>
        </div>

        {ErrorBlock && <p className="error">{errorMessage}</p>}

        {newBlock && (
          <div className="reduce-block">
            <div className="link">
              <p onClick={handleCopyText} className="copyable-text">
                {reduceLink}
              </p>
              <button className="button copy" onClick={handleCopyText}>
                Copy
              </button>
              {isCopied && <div className="notification">Copied!</div>}
            </div>
            <div className="qr-code">
              <QRCodeSVG value={reduceLink} size={100} />
            </div>
          </div>
        )}

        <div className="tabs-container">
          <div className="tabs-header">
            <button
              className={`tab-button ${
                activeTab === "Redirect" ? "active" : ""
              }`}
              onClick={() => handleTabClick("Redirect")}
            >
              Redirect
            </button>
            <button
              className={`tab-button ${activeTab === "Delete" ? "active" : ""}`}
              onClick={() => handleTabClick("Delete")}
            >
              Delete
            </button>
            <button
              className={`tab-button ${activeTab === "Edit" ? "active" : ""}`}
              onClick={() => handleTabClick("Edit")}
            >
              Edit
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "Redirect" && (
              <div className="redirect-tab">
                <InputLink
                  className="input_alias"
                  value={inputAliasRedirect}
                  onChange={setInputAliasRedirect}
                  placeholder={"Input alias"}
                />
                <button className="button redirect" onClick={handleRedirect}>
                  Redirect
                </button>
              </div>
            )}
            

            {activeTab === "Delete" && (
              <div className="delete-tab">
                <InputLink
                  className="input_alias"
                  value={inputAliasDelete}
                  onChange={setInputAliasDelete}
                  placeholder={"Input alias"}
                />
                <button className="button delete" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            )}

            {activeTab === "Edit" && (
              <div className="edit-tab">
                <InputLink
                className="input_alias"
                  value={editInput}
                  onChange={setEditInput}
                  placeholder={"Input exist alias"}
                />
                <InputLink
                className="input_alias"
                  value={inputAliasEdit}
                  onChange={setInputAliasEdit}
                  placeholder={"Input new alias"}
                />
                <button className="button" onClick={handleEditSubmit}>
                  Update
                </button>
              </div>
            )}
          </div>
        </div>

        {ErrorBlockTwo && <p className="error">{errorMessageTwo}</p>}
      </div>
    </div>
  );
}

export default App;
