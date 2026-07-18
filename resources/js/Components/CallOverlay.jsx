/**
 * Full-screen calling UI (outgoing / incoming / connected), driven by useCall.
 * Looks and behaves like a Messenger call: remote video fills the screen, your
 * own camera sits in a small corner tile, with mute / camera / hang-up controls.
 */
function RoundButton({ onClick, title, variant = 'neutral', big, children }) {
    const size = big ? 'h-16 w-16' : 'h-14 w-14';
    const styles = {
        neutral: 'bg-white/15 text-white hover:bg-white/25',
        success: 'bg-green-500 text-white hover:bg-green-600',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };
    return (
        <button onClick={onClick} title={title} className={`flex ${size} items-center justify-center rounded-full shadow-lg transition ${styles[variant]}`}>
            {children}
        </button>
    );
}

// Filled icons matching the reference call icon set.
const Icons = {
    phone: <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" /></svg>,
    hangup: <svg className="h-6 w-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" /></svg>,
    mic: <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z" /></svg>,
    micOff: <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15 11V5a3 3 0 00-5.94-.6L15 10.4V11zM4.27 3L3 4.27l6 6V11a3 3 0 004.72 2.45l1.4 1.4A4.9 4.9 0 0112 15a5 5 0 01-5-5H5a7 7 0 006 6.92V21h2v-3.08a6.9 6.9 0 002.28-.72L19.73 21 21 19.73 4.27 3z" /></svg>,
    video: <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" /></svg>,
    videoOff: <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6.5l-4 4V7a1 1 0 00-1-1H9.83l11 11 .17.17V6.5zM3.27 2L2 3.27l2 2V17a1 1 0 001 1h11.73l3 3L21 19.73 3.27 2z" /></svg>,
};

export default function CallOverlay({ call, partnerName }) {
    const { state, callType, muted, camOff, durationLabel, localRef, remoteRef } = call;
    if (state === 'idle') return null;

    const isVideo = callType === 'video';

    return (
        <div className="fixed inset-0 z-[80] flex flex-col bg-ink">
            {/* Remote video / avatar */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                {/* Remote media is ALWAYS mounted while the overlay is open so the
                    other person's AUDIO plays even in a voice-only call (the video
                    is simply hidden then). */}
                <video
                    ref={remoteRef}
                    autoPlay
                    playsInline
                    className={`h-full w-full bg-black object-cover ${state === 'connected' && isVideo ? '' : 'hidden'}`}
                />

                {!(state === 'connected' && isVideo) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gold/20 text-5xl font-black text-gold">
                            {partnerName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{partnerName}</p>
                            <p className="mt-1 text-sm text-gray-400">
                                {state === 'calling' && 'Calling…'}
                                {state === 'incoming' && `Incoming ${isVideo ? 'video' : 'voice'} call…`}
                                {state === 'connected' && `Voice call · ${durationLabel}`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Connected video timer */}
                {state === 'connected' && isVideo && (
                    <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm font-semibold text-white">
                        {partnerName} · {durationLabel}
                    </div>
                )}

                {/* Local camera preview (always mounted for video so the stream attaches) */}
                {isVideo && (
                    <video
                        ref={localRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute bottom-6 right-6 h-40 w-28 rounded-2xl border-2 border-white/20 bg-black object-cover shadow-xl ${camOff ? 'hidden' : ''} ${state === 'connected' ? '' : 'opacity-90'}`}
                    />
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-5 bg-black/40 py-8">
                {state === 'incoming' ? (
                    <>
                        <RoundButton onClick={call.decline} title="Decline" variant="danger" big>{Icons.hangup}</RoundButton>
                        <RoundButton onClick={call.accept} title="Accept" variant="success" big>{Icons.phone}</RoundButton>
                    </>
                ) : (
                    <>
                        <RoundButton onClick={call.toggleMute} title={muted ? 'Unmute' : 'Mute'} variant={muted ? 'danger' : 'neutral'}>
                            {muted ? Icons.micOff : Icons.mic}
                        </RoundButton>

                        {isVideo && (
                            <RoundButton onClick={call.toggleCam} title={camOff ? 'Turn camera on' : 'Turn camera off'} variant={camOff ? 'danger' : 'neutral'}>
                                {camOff ? Icons.videoOff : Icons.video}
                            </RoundButton>
                        )}

                        <RoundButton onClick={call.hangup} title="Hang up" variant="danger" big>{Icons.hangup}</RoundButton>
                    </>
                )}
            </div>
        </div>
    );
}
