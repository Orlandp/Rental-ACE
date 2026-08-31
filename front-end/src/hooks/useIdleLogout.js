import { useEffect, useRef } from "react";
import { API_BASE } from '../config';

function useIdleLogout (timeoutMinutes) {
    const timerRef = useRef(null);

    useEffect(() => {
        const timeoutMs = timeoutMinutes * 60 * 1000;
        
        function logout() {
            fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            }).finally(() => {
                window.location.href = '/login';
            })
        }
        function resetTimer () {
            if(timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(logout, timeoutMs);
        }

        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((event) => window.addEventListener(event, resetTimer));

        resetTimer();

        return () => {
            events.forEach((event) =>window.removeEventListener(event, resetTimer));
            if(timerRef.current)clearTimeout(timerRef.current);
        };
    }, [timeoutMinutes]);
}

export default useIdleLogout;