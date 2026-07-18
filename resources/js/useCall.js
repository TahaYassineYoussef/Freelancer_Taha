import { useEffect, useRef, useState } from 'react';

/**
 * Peer-to-peer audio/video calling over WebRTC.
 *
 * The signalling (offer / answer / ICE candidates) travels through the chat
 * `signal` endpoint, which the chat page already polls. Once connected, audio
 * and video flow directly browser-to-browser — the server only helped the two
 * peers find each other.
 *
 * A free public STUN server handles most networks. Users behind strict
 * firewalls may additionally need a TURN relay (added later if needed).
 *
 * Usage:
 *   const call = useCall({ sendSignal });
 *   call.handleSignal(sig)   // feed every incoming signal from the poll
 *   call.startCall(true)     // start a video call (false = audio only)
 */
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export default function useCall({ sendSignal }) {
    const [state, setState] = useState('idle'); // idle | calling | incoming | connected
    const [callType, setCallType] = useState('video'); // video | audio
    const [muted, setMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);
    const [seconds, setSeconds] = useState(0);

    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const pendingIce = useRef([]);
    const incomingOffer = useRef(null);

    // Call timer while connected.
    useEffect(() => {
        if (state !== 'connected') return;
        setSeconds(0);
        const id = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [state]);

    const attachStream = (ref, stream) => {
        if (ref.current) ref.current.srcObject = stream;
    };

    const getMedia = async (video) => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
        localStreamRef.current = stream;
        // The <video> may mount a tick later; retry attach on the next frame too.
        attachStream(localRef, stream);
        requestAnimationFrame(() => attachStream(localRef, stream));
        return stream;
    };

    const createPeer = () => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pc.onicecandidate = (e) => {
            if (e.candidate) sendSignal('ice', JSON.stringify(e.candidate));
        };
        pc.ontrack = (e) => {
            attachStream(remoteRef, e.streams[0]);
            requestAnimationFrame(() => attachStream(remoteRef, e.streams[0]));
            setState('connected');
        };
        pc.onconnectionstatechange = () => {
            if (['failed', 'closed'].includes(pc.connectionState)) cleanup();
        };

        pcRef.current = pc;
        return pc;
    };

    const flushIce = async () => {
        const pc = pcRef.current;
        if (!pc) return;
        for (const c of pendingIce.current) {
            try { await pc.addIceCandidate(c); } catch { /* ignore late/dupe candidate */ }
        }
        pendingIce.current = [];
    };

    const cleanup = () => {
        try { pcRef.current?.close(); } catch { /* noop */ }
        pcRef.current = null;
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        if (localRef.current) localRef.current.srcObject = null;
        if (remoteRef.current) remoteRef.current.srcObject = null;
        pendingIce.current = [];
        incomingOffer.current = null;
        setMuted(false);
        setCamOff(false);
        setState('idle');
    };

    // --- Public actions ------------------------------------------------------

    const startCall = async (video = true) => {
        try {
            setCallType(video ? 'video' : 'audio');
            const stream = await getMedia(video);
            const pc = createPeer();
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            setState('calling');
            sendSignal('offer', JSON.stringify({ sdp: pc.localDescription, video }));
        } catch (e) {
            cleanup();
            alert('Could not start the call. Please allow camera & microphone access, then try again.');
        }
    };

    const accept = async () => {
        const data = incomingOffer.current;
        if (!data) return;
        try {
            const stream = await getMedia(!!data.video);
            const pc = createPeer();
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await flushIce();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal('answer', JSON.stringify({ sdp: pc.localDescription }));
            setState('connected');
        } catch (e) {
            cleanup();
            alert('Could not join the call. Please allow camera & microphone access.');
        }
    };

    const decline = () => {
        sendSignal('decline');
        cleanup();
    };

    const hangup = () => {
        sendSignal('hangup');
        cleanup();
    };

    const toggleMute = () => {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (!track) return;
        track.enabled = !track.enabled;
        setMuted(!track.enabled);
    };

    const toggleCam = () => {
        const track = localStreamRef.current?.getVideoTracks()[0];
        if (!track) return;
        track.enabled = !track.enabled;
        setCamOff(!track.enabled);
    };

    /**
     * Feed every signal arriving from the chat poll here.
     */
    const handleSignal = async (sig) => {
        try {
            switch (sig.kind) {
                case 'offer': {
                    if (state !== 'idle') break; // already busy
                    const data = JSON.parse(sig.payload);
                    incomingOffer.current = data;
                    setCallType(data.video ? 'video' : 'audio');
                    setState('incoming');
                    break;
                }
                case 'answer': {
                    const data = JSON.parse(sig.payload);
                    await pcRef.current?.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    await flushIce();
                    break;
                }
                case 'ice': {
                    const candidate = JSON.parse(sig.payload);
                    if (pcRef.current?.remoteDescription) {
                        try { await pcRef.current.addIceCandidate(candidate); } catch { /* ignore */ }
                    } else {
                        pendingIce.current.push(candidate);
                    }
                    break;
                }
                case 'decline':
                case 'hangup':
                    cleanup();
                    break;
                default:
                    break;
            }
        } catch {
            /* malformed signal — ignore */
        }
    };

    // Hang up cleanly if the component unmounts mid-call.
    useEffect(() => () => cleanup(), []); // eslint-disable-line react-hooks/exhaustive-deps

    const durationLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

    return {
        state, callType, muted, camOff, durationLabel,
        localRef, remoteRef,
        startCall, accept, decline, hangup, toggleMute, toggleCam, handleSignal,
    };
}
