import PanelLayout from '@/Layouts/PanelLayout';
import Photo from '@/Components/Photo';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const FREELANCER_PHOTO = ['/images/taha.png', '/images/taha.jpg'];

function fmtTime(value) {
    return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function Chat({ partners, selectedPartner, messages: initialMessages }) {
    const { auth } = usePage().props;
    const meId = auth.user.id;

    const [messages, setMessages] = useState(initialMessages ?? []);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    // Reset the thread whenever a different conversation is opened.
    useEffect(() => {
        setMessages(initialMessages ?? []);
    }, [selectedPartner?.id]);

    // Poll for new messages every 3 seconds.
    useEffect(() => {
        if (!selectedPartner) return;
        const id = setInterval(() => {
            window.axios
                .get(route('chat.fetch', selectedPartner.id))
                .then((res) => setMessages(res.data.messages))
                .catch(() => {});
        }, 3000);
        return () => clearInterval(id);
    }, [selectedPartner?.id]);

    // Auto-scroll to the newest message.
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = (e) => {
        e.preventDefault();
        const text = body.trim();
        if (!text || !selectedPartner) return;
        setSending(true);
        window.axios
            .post(route('chat.store', selectedPartner.id), { body: text })
            .then((res) => {
                setMessages(res.data.messages);
                setBody('');
            })
            .finally(() => setSending(false));
    };

    const openConversation = (partner) => {
        router.get(route('chat.index'), { with: partner.id }, { preserveState: false });
    };

    return (
        <PanelLayout title="Messages">
            <Head title="Chat" />

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Conversation list */}
                <aside className="rounded-2xl border border-white/5 bg-ink-700 p-3">
                    <h2 className="px-3 py-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                        Conversations
                    </h2>
                    <div className="space-y-1">
                        {partners.length === 0 && (
                            <p className="px-3 py-4 text-sm text-gray-500">No conversations yet.</p>
                        )}
                        {partners.map((p) => {
                            const active = selectedPartner?.id === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => openConversation(p)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                        active ? 'bg-gold/15' : 'hover:bg-white/5'
                                    }`}
                                >
                                    <Photo
                                        src={p.role === 'freelancer' ? FREELANCER_PHOTO : null}
                                        name={p.name}
                                        rounded="rounded-full"
                                        className="h-10 w-10 flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className={`truncate text-sm font-semibold ${active ? 'text-gold' : 'text-white'}`}>
                                            {p.name}
                                        </p>
                                        <p className="truncate text-xs capitalize text-gray-500">{p.role}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Message thread */}
                <section className="flex h-[65vh] flex-col rounded-2xl border border-white/5 bg-ink-700">
                    {selectedPartner ? (
                        <>
                            <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
                                <Photo
                                    src={selectedPartner.role === 'freelancer' ? FREELANCER_PHOTO : null}
                                    name={selectedPartner.name}
                                    rounded="rounded-full"
                                    className="h-10 w-10"
                                />
                                <div>
                                    <p className="font-semibold text-white">{selectedPartner.name}</p>
                                    <p className="text-xs capitalize text-gray-500">{selectedPartner.role}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                                {messages.length === 0 && (
                                    <p className="mt-10 text-center text-sm text-gray-500">
                                        No messages yet. Say hello 👋
                                    </p>
                                )}
                                {messages.map((m) => {
                                    const mine = m.sender_id === meId;
                                    return (
                                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                                                    mine
                                                        ? 'rounded-br-sm bg-gold text-ink'
                                                        : 'rounded-bl-sm bg-ink-600 text-gray-100'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                                <p className={`mt-1 text-[10px] ${mine ? 'text-ink/60' : 'text-gray-500'}`}>
                                                    {fmtTime(m.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            <form onSubmit={send} className="flex gap-3 border-t border-white/5 p-4">
                                <input
                                    type="text"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Type a message…"
                                    className="flex-1 rounded-full border border-white/10 bg-ink px-5 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !body.trim()}
                                    className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-300 disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-gray-500">
                            Select a conversation to start chatting.
                        </div>
                    )}
                </section>
            </div>
        </PanelLayout>
    );
}
