// The AIConsole Project
//
// Copyright 2023 10Clouds
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Editor from 'react-simple-code-editor';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';

import { cn } from '@/utils/common/cn';
import { FocusEvent, useCallback, useRef, useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

const DEFAULT_MAX_HEIGHT = 'calc(100% - 50px)';

interface CodeInputProps {
  label?: string;
  value: string;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  codeLanguage?: string;
  disabled?: boolean;
  readOnly?: boolean;
  transparent?: boolean;
  maxHeight?: string;
}

export function CodeInput({
  label,
  value,
  className,
  onChange,
  onBlur,
  codeLanguage,
  disabled = false,
  readOnly = false,
  transparent = false,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: CodeInputProps) {
  const [focus, setFocus] = useState(false);
  const editorBoxRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const onHighlight = (code: string) => {
    if (!code) return '';

    let lang = codeLanguage;
    if (!lang) {
      const { language } = hljs.highlightAuto(code);
      lang = language;
    }
    return hljs.highlight(code, { language: lang || 'python' }).value;
  };

  const handleValueChange = (code: string) => {
    if (onChange) {
      onChange(code);
    }
  };

  // When using styles and different HTML structure there was always confilct
  // with streching textarea to full container height (when content is smaller
  // than editor window) and preserving scrolling when content it longer. Current
  // solution is a workaround to focus textarea even if textarea does not fills
  // whole editor space. To not cause border flashing and losing focus on button
  // click we use useOutsideClick hook instead of onBlur. Textarea elemet is set
  // as ref on first click/focus event as we can't pass ref to editor's textarea.

  const handleEditorBoxClick = useCallback(({ target }: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const isFocused = target === document.activeElement;
    if (isFocused) return;

    if (!textareaRef.current) {
      const textarea = (target as HTMLDivElement).querySelector('textarea');
      if (textarea) {
        textareaRef.current = textarea;
        textarea.focus();
      }
    } else {
      textareaRef.current.focus();
    }
  }, []);

  const handleFocus = useCallback(({ target }: FocusEvent<HTMLDivElement> & FocusEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) {
      if (target) {
        textareaRef.current = target;
      }
    }

    setFocus(true);
  }, []);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (textareaRef.current?.contains(event.target as HTMLElement)) {
        if (textareaRef.current && (!disabled || !readOnly)) {
          textareaRef.current.focus();
        }

        return;
      }

      setFocus(false);
      onBlur?.();
    },
    [disabled, onBlur, readOnly],
  );

  useClickOutside(editorBoxRef, handleClickOutside);

  return (
    <div className="h-full">
      {label && (
        <label htmlFor={label} className="font-bold block mb-4">
          {label}:
        </label>
      )}
      <div
        ref={editorBoxRef}
        style={{
          maxHeight,
          minHeight: maxHeight,
        }}
        className={cn(
          className,
          'border-gray-500  w-[calc(100%-8px)] font-mono text-sm overflow-y-auto bg-gray-800 border rounded-[8px]  transition duration-100',
          {
            'bg-gray-600 border-gray-400': focus,
            'hover:bg-gray-600 hover:placeholder:text-gray-300': !disabled && !readOnly,
          },
        )}
        onClick={handleEditorBoxClick}
      >
        <Editor
          value={value}
          disabled={disabled || readOnly}
          textareaId={label}
          onValueChange={handleValueChange}
          onFocus={handleFocus}
          highlight={(code) => onHighlight(code)}
          padding={10}
          className={cn(
            'resize-none appearance-none border border-transparent w-full leading-tight placeholder-gray-400 bottom-0 p-0 h-full  placeholder:text-gray-400  text-[15px] text-white  rounded-[8px]  ',
            {
              'opacity-[0.7] ': disabled,
              'bg-transparent': transparent,
              'pointer-events-none': disabled || readOnly,
            },
          )}
          preClassName="!px-[20px] !py-[12px] "
          textareaClassName={cn('focus:!outline-none focus:!shadow-none h-full !px-[20px] !py-[12px] ', {
            'cursor-not-allowed': disabled,
          })}
        />
      </div>
    </div>
  );
}
