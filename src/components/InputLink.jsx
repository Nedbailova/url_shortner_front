import React from 'react';
import "./styles/InputLink.css";

export function InputLink({ value, onChange, placeholder, className }) {

  return (
    <div className='input-block'>
      <input
        className={'input ' + className}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
