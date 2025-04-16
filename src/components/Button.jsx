import React from 'react';
import "./styles/Button.css";

export function Button({inputValue, SetNewBlock, SetErrorBlock, setErrorMessage, text, copy, handleCopyText}) {

    const ReduceLink = () => {
        if (!inputValue) {
          setErrorMessage('It seems you forgot to enter the link...'); 
          SetErrorBlock(true); 
          SetNewBlock(false); 
        } 
        else {
    
            const valid = /^(ftp|http|https):\/\/[^ "]+$/.test(inputValue);
    
            if (valid) {
                SetErrorBlock(false); 
                SetNewBlock(true); 
            } else {
                setErrorMessage('Please enter the correct link!'); 
                SetErrorBlock(true); 
                SetNewBlock(false); 
            }
        }
    };

    const OnClick = copy ? handleCopyText : ReduceLink;

  return (
    <button className='button' onClick={OnClick}>{text}</button>
  );
}
