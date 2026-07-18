/**
 * Full-screen calling UI (outgoing / incoming / connected), driven by useCall.
 * Looks and behaves like a Messenger call: remote video fills the screen, your
 * own camera sits in a small corner tile, with mute / camera / hang-up controls.
 */
function RoundButton({ onClick, title, active, danger, children }) {
    const base = 'flex h-14 w-14 items-center justify-center rounded-full text-white transition';
    const cls = danger
        ? 'bg-red-500 hover:bg-red-600'
        : active
            ? 'bg-white/90 text-ink hover:bg-white'
            : 'bg-white/15 hover:bg-white/25';
    return (
        <button onClick={onClick} title={title} className={`${base} ${cls}`}>
            {children}
        </button>
    );
}

export default function CallOverlay({ call, partnerName }) {
    const { state, callType, muted, camOff, durationLabel, localRef, remoteRef } = call;
    if (state === 'idle') return null;

    const isVideo = callType === 'video';

    return (
        <div className="fixed inset-0 z-[80] flex flex-col bg-ink">
            {/* Remote video / avatar */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                {state === 'connected' && isVideo ? (
                    <video ref={remoteRef} autoPlay playsInline className="h-full w-full bg-black object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
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
                        <RoundButton onClick={call.decline} title="Decline" danger>
                            <svg className="h-6 w-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" /></svg>
                        </RoundButton>
                        <RoundButton onClick={call.accept} title="Accept">
                            <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" /></svg>
                        </RoundButton>
                    </>
                ) : (
                    <>
                        <RoundButton onClick={call.toggleMute} title={muted ? 'Unmute' : 'Mute'} active={muted}>
                            {muted ? (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18M9 9v3a3 3 0 004.24 2.73M15 11V5a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12M12 19v3" /></svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3zM19 12a7 7 0 01-14 0M12 19v3" /></svg>
                            )}
                        </RoundButton>

                        {isVideo && (
                            <RoundButton onClick={call.toggleCam} title={camOff ? 'Turn camera on' : 'Turn camera off'} active={camOff}>
                                {camOff ? (
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18M15 10.5V7a1 1 0 00-1-1H8m-3 .5A1 1 0 004 7v10a1 1 0 001 1h9a1 1 0 001-1v-2l4 3V6l-4 3" /></svg>
                                ) : (
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4-3v10l-4-3v2a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h9a1 1 0 011 1z" /></svg>
                                )}
                            </RoundButton>
                        )}

                        <RoundButton onClick={call.hangup} title="Hang up" danger>
                            <svg className="h-6 w-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" /></svg>
                        </RoundButton>
                    </>
                )}
            </div>
        </div>
    );
}
