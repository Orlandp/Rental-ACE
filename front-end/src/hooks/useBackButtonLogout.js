import { useEffect } from "react";
import { API_BASE } from '../config';

function useBackButtonLogout() {
    useEffect(() => {
        function logout() {
            fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                keepalive: true,
            });
        }

        function handlePageHide() {
            logout();
        }

        function handlePageShow(event) {
            if (event.persisted) {
                window.location.replace('/login');
            }
        }

        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);
}

export default useBackButtonLogout;
