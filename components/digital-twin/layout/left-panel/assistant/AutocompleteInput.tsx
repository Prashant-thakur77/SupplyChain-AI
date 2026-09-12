"use client"

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AutocompleteInputProps } from './types';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';


export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  autocompleteSuggestions,
  recentQueries,
  onAutocompleteSelect,
  showRecentInHeader
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 36, maxHeight: 150 });

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [input, adjustHeight, textareaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      setInput((typeof input === 'string' ? input : '') + '\n');
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (showAutocomplete && selectedIndex >= 0) {
          onAutocompleteSelect(autocompleteSuggestions[selectedIndex]);
        } else if (input && typeof input === 'string' && input.trim()) {
          onSubmit(input);
          setInput("");
        }
        return;
    }

    if (!showAutocomplete) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, autocompleteSuggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Escape':
        setShowAutocomplete(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault();
          onAutocompleteSelect(autocompleteSuggestions[selectedIndex]);
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value || "";
    setInput(newValue);
    setSelectedIndex(-1);
  };

  const handleScroll = useCallback(() => {
    // Placeholder for scroll handling logic if needed
  }, []);

  const onSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input || typeof input !== 'string' || !input.trim()) return;
    
    onSubmit(input);
    setInput("");
    setShowAutocomplete(false);
  };

  return (
    <div className="p-2 border-t border-border bg-background">
      <div className="flex flex-col-reverse gap-2">
        <form onSubmit={onSubmitForm} className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="border-input bg-background rounded-lg border p-1.5 shadow-xs">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="text-primary text-sm placeholder:text-xs placeholder:text-muted-foreground/70 min-h-[36px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-1"
                disabled={isLoading}
                onFocus={() => {
                  setShowAutocomplete(true);
                }}
                rows={1}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input || typeof input !== 'string' || !input.trim()}
            className="px-2 py-2 rounded-md h-8 w-8"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </form>

        {/* Autocomplete Pills */}
        {((showAutocomplete && autocompleteSuggestions.length > 0) || (!input && recentQueries.length > 0)) && (
          <div className="w-full space-y-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1 px-1">
                <Sparkles className="h-3 w-3" />
                AI Suggestions
                {showRecentInHeader && (
                  <>
                    <span className="mx-1">•</span>
                    <Clock className="h-3 w-3" />
                    Recent queries
                  </>
                )}
              </div>
              <div 
                ref={scrollContainerRef}
                className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={handleScroll}
              >
                {/* AI Suggestions first */}
                {autocompleteSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => onAutocompleteSelect(suggestion)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105",
                      "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100",
                      "flex-shrink-0 whitespace-nowrap",
                      selectedIndex === index && "ring-2 ring-primary ring-offset-1"
                    )}
                    title={suggestion.description}
                  >
                    <span className="truncate">{suggestion.text}</span>
                  </button>
                ))}
                
                {/* Recent Queries at the end - only show when input is empty */}
                {!input && recentQueries.length > 0 && recentQueries.slice(0, 5).map((query, index) => (
                  <button
                    key={`recent-${index}`}
                    onClick={() => {
                      setInput(query);
                      setShowAutocomplete(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-muted/50 hover:bg-muted border-muted-foreground/20 transition-all duration-200 hover:scale-105 flex-shrink-0 whitespace-nowrap"
                  >
                    {query.length > 30 ? query.substring(0, 30) + '...' : query}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 