import { useState, useEffect } from 'react';

export default function useMobileDetect() {
    const [deviceInfo, setDeviceInfo] = useState({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isIOS: false,
        isAndroid: false,
        isPWA: false,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
    });

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const userAgent = navigator.userAgent.toLowerCase();

            // Check if running as PWA
            const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;

            // Detect device type
            const isMobile = width <= 768;
            const isTablet = width > 768 && width <= 1024;
            const isDesktop = width > 1024;

            // Detect OS
            const isIOS = /iphone|ipad|ipod/.test(userAgent);
            const isAndroid = /android/.test(userAgent);

            setDeviceInfo({
                isMobile,
                isTablet,
                isDesktop,
                isIOS,
                isAndroid,
                isPWA,
                screenWidth: width,
                screenHeight: window.innerHeight
            });
        };

        // Check on mount
        checkDevice();

        // Check on resize
        window.addEventListener('resize', checkDevice);

        // Check on orientation change
        window.addEventListener('orientationchange', checkDevice);

        return () => {
            window.removeEventListener('resize', checkDevice);
            window.removeEventListener('orientationchange', checkDevice);
        };
    }, []);

    return deviceInfo;
}
