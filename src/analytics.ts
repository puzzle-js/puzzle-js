const measureScript = `
    function getTimeToFirstPaintIfSupported() {
        if (window.performance && window.performance.timing) {
            var navTiming = window.performance.timing;
            var navStart = navTiming.navigationStart;
            var fpTime;
    
            if (window.chrome && window.chrome.loadTimes) {
                fpTime = window.chrome.loadTimes().firstPaintTime * 1000;
            }
    
            else if (navTiming.msFirstPaint) {
                fpTime = navTiming.msFirstPaint;
            }
    
            if (fpTime && navStart) {
                return fpTime - navStart;
            }
        }
    };
`;


export default class Analytics {

}
