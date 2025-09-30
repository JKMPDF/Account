
import { useEffect, useCallback } from 'react';

type HotkeyCallback = (event: KeyboardEvent) => void;
type Hotkey = [string, HotkeyCallback];

const parseHotkey = (hotkey: string) => {
    const keys = hotkey.toLowerCase().split('+');
    const key = keys.pop() || '';
    const ctrl = keys.includes('ctrl');
    const alt = keys.includes('alt');
    const shift = keys.includes('shift');
    return { key, ctrl, alt, shift };
};

export const useHotkeys = (hotkeys: Hotkey[]) => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        for (const [hotkey, callback] of hotkeys) {
            const parsed = parseHotkey(hotkey);
            if (
                event.key.toLowerCase() === parsed.key &&
                event.ctrlKey === parsed.ctrl &&
                event.altKey === parsed.alt &&
                event.shiftKey === parsed.shift
            ) {
                callback(event);
            }
        }
    }, [hotkeys]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};
