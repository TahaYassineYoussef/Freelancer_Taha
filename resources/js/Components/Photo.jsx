import { useEffect, useState } from 'react';

/**
 * Renders an <img> from the given src. `src` may be a single URL or an array
 * of URLs that are tried in order (e.g. try .png, then .jpg). If every source
 * fails to load, it falls back to a gold gradient block with the initials.
 */
export default function Photo({ src, name = 'Taha Yassine Youssef', className = '', rounded = 'rounded-2xl' }) {
    const sources = (Array.isArray(src) ? src : [src]).filter(Boolean);
    const [index, setIndex] = useState(0);

    // Restart from the first source whenever the list changes.
    useEffect(() => {
        setIndex(0);
    }, [sources.join('|')]);

    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    const exhausted = index >= sources.length;

    if (exhausted || sources.length === 0) {
        return (
            <div
                className={`flex items-center justify-center bg-gradient-to-br from-gold-400 to-gold-700 font-black text-ink ${rounded} ${className}`}
            >
                <span className="text-[22%] leading-none">{initials}</span>
            </div>
        );
    }

    return (
        <img
            src={sources[index]}
            alt={name}
            onError={() => setIndex((i) => i + 1)}
            className={`object-cover ${rounded} ${className}`}
        />
    );
}
