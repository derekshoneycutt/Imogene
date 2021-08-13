import AnimationState from './AnimationState';
import { getOwnProperties } from '../Base';

/**
 * Run an animation
 * @param {Function} frame animation frame to be run
 * @param {number} interval interval to operate the animation by
 * @param {any} startdetails details to pass to each frame of the animation
 * @returns {Promise<void>} Promise that resolves when the animation is complete
 */
export const animation = (frame, interval, startdetails) =>
    new AnimationState().runAsPromise(frame, interval, startdetails);

/**
 * Get an array of functions that make the specified changes to the object
 * @param {any} el Object to animate
 * @param {{}} vals Values to create frame methods for
 * @param {number} time length of time the animation should take
 * @param {number} interval interval between frames
 * @returns {Function[]} Array of functions to perform frames of animation
 */
const getChanges = (el, vals, time, interval) =>
    getOwnProperties(vals)
        .map(v => {
            const changeVal =
                (parseFloat(vals[v]) - parseFloat(el[v])) /
                ((time || 1000) / (interval || 10));
            const cmpFunc = changeVal > 0 ?
                ((o, n, g) => n <= o || n >= g) :
                ((o, n, g) => n >= o || n <= g);
            return e => {
                const prev = parseFloat(el[v]);
                const toset = changeVal * e + prev;
                const ret = cmpFunc(prev, toset, vals[v]);
                el[v] = ret ? vals[v] : toset;
                return ret;
            };
        });

/**
 * Animate a value
 * @param {any} el Object to animate the properties of
 * @param {{}} vals Values to animate to
 * @param {number} time Length of time the animation should last
 * @param {number} interval interval between frames
 * @returns {Promise<{}>} Promise that resolves when the animation is complete
 */
export const animate = (el, vals, time, interval) =>
    animation((d, e) =>
        d.length === 0 ?
            false :
            {
                continue: true,
                details: d.filter(c => !c(e))
            },
        interval || 10, getChanges(el, vals, time || 1000, interval || 10))
        .then(() => vals);
