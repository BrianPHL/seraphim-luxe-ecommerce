import { useState, useEffect, useRef } from 'react';
import { Button, InputField } from '@components';
import { useAuth, useToast, useGeminiAI } from '@contexts';
import styles from './GeminiAIChatbot.module.css';

const GeminiAIChatbot = () => {

    const [ isOpen, setIsOpen ] = useState(false);
    const [ message, setMessage ] = useState('');
    const [ localChatHistory, setLocalChatHistory ] = useState([]);
    const [ isTyping, setIsTyping ] = useState(false);

    const chatBodyRef = useRef(null);
    const { user, setIsPopupOpen } = useAuth();
    const { showToast } = useToast();
    const { isLoading, chatHistory, predefinedQuestions, fetchChatHistory, sendGeminiAICustomerChat, sendGeminiAIAdminChat } = useGeminiAI();

    const requireAuth = (action) => {
        
        if (!user) {
            setIsPopupOpen(true);
            return;
        }

        action();

    };

    const handleWrapperClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    const scrollToBottom = () => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    };

    const addUserMessageToChat = (userMessage) => {
        const userChatEntry = {
            id: Date.now(),
            message_type: 'user',
            message: userMessage,
            created_at: new Date().toISOString()
        };
        
        setLocalChatHistory(prev => [...prev, userChatEntry]);
        setTimeout(scrollToBottom, 100);
    };

    const addAIResponseToChat = (aiResponse) => {
        const aiChatEntry = {
            id: Date.now(),
            message_type: 'ai',
            message: aiResponse,
            created_at: new Date().toISOString()
        };
        
        setLocalChatHistory(prev => [...prev, aiChatEntry]);
        setTimeout(scrollToBottom, 100);
    };

    const handleSubmitChatToGeminiAI = async () => {

        try {

            if (!user) return;

            const userMessage = message.trim();
            setMessage('');

            addUserMessageToChat(userMessage);

            setIsTyping(true);

            const result = user.role === 'customer'
                ? await sendGeminiAICustomerChat(userMessage)
                : await sendGeminiAIAdminChat(userMessage);

            setIsTyping(false);

            if (result?.data) {
                addAIResponseToChat(result.data);
            }

            setTimeout(() => {
                fetchChatHistory();
            }, 500);

        } catch(err) {

            console.error('GeminiAIChatbot component handleSubmitChatToGeminiAI function error: ', err);
            showToast('An error occured when processing your Chatbot request. Please try again later.', 'error');

            setIsTyping(false);
            setLocalChatHistory(prev => prev.slice(0, -1));

        }

    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'Enter' && !e.shiftKey && message) {
            e.preventDefault();
            handleSubmitChatToGeminiAI();
        }
    };

    useEffect(() => {
        setLocalChatHistory(chatHistory);
    }, [chatHistory]);

    useEffect(() => {
        if (isOpen && user) {
            fetchChatHistory();
        }
    }, [isOpen, user, fetchChatHistory]);

    useEffect(() => {
        scrollToBottom();
    }, [localChatHistory, isTyping]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, message, isLoading, isTyping]);

    return (
        <>
            <div className={ styles['wrapper'] } data-open={ isOpen } onClick={ handleWrapperClick }>
                <div className={ styles['chat'] }>
                    <div className={ styles['chat-header'] }>
                        <h3>Seraphim Luxe Chatbot</h3>
                        <Button
                            type='icon'
                            icon='fa solid fa-times'
                            action={ () => setIsOpen(false) }
                        />
                    </div>
                    <div className={ styles['chat-body'] }>
                        <div className={ styles['chat-body-upper'] } ref={ chatBodyRef }>
                            <>
                                {
                                    localChatHistory.length > 0 ? (
                                        <div className={ styles['messages'] }>
                                            { localChatHistory.map((chat) => {
                                                return (
                                                    <p key={ chat.id } className={ styles['message'] } data-role={chat.message_type}>
                                                        <span className={ styles['message-label'] }>
                                                            { chat.message_type === 'user' ? 'You' : 'Agent'}
                                                        </span>
                                                        { chat.message }
                                                    </p>
                                                );
                                            })}
                                            {
                                                (isLoading || isTyping) && (
                                                    <p className={ styles['message'] } data-role="ai">
                                                        <span className={ styles['message-label'] }>Agent</span>
                                                        <em>Typing...</em>
                                                    </p>
                                                )
                                            }
                                        </div>
                                    ) : (
                                        <div className={ styles['placeholder'] }>
                                            <h2 className={ styles['placeholder-title'] }>Seraphim Luxe AI</h2>
                                            <p className={ styles['placeholder-body'] }>
                                                {
                                                    user && user.role === 'customer'
                                                    ? 'Unlock exclusive shopping tips, get instant answers, and discover the perfect products just for you!'
                                                    : 'Streamline your workflow, access business insights, and manage store operations faster!'
                                                }
                                            </p>
                                        </div>
                                    )
                                }
                                <div className={ styles['chat-options'] }>
                                    <div className={ styles['chat-options-predefined_questions'] }>
                                        <Button
                                            type='secondary'
                                            label='What products do you recommend for me?'
                                            action={ () => {} }
                                            externalStyles={ styles['chat-options-predefined_question'] }
                                        />
                                        <Button
                                            type='secondary'
                                            label='What are your newest arrivals?'
                                            action={ () => {} }
                                            externalStyles={ styles['chat-options-predefined_question'] }
                                        />
                                        <Button
                                            type='secondary'
                                            label='Which items are your best sellers?'
                                            action={ () => {} }
                                            externalStyles={ styles['chat-options-predefined_question'] }
                                        />
                                    </div>
                                    <Button
                                        type='primary'
                                        icon='fa solid fa-headset'
                                        label='Talk to our live agent'
                                        iconPosition='left'
                                        action={ () => setIsPopupOpen(false) }
                                        externalStyles={ styles['chat-options-switch_btn'] }
                                    />
                                </div>
                            </>
                        </div>
                        <div className={ styles['chat-body-lower'] }>
                            <InputField
                                value={ message }
                                onChange={event => setMessage(event.target.value)}
                                hint='Ask anything...'
                                type='text'
                                isSubmittable={ false }
                            />
                            <Button
                                type='icon-outlined'
                                icon='fa-solid fa-paper-plane'
                                disabled={ !message || isLoading || isTyping }
                                action={ handleSubmitChatToGeminiAI }
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Button
                type='secondary'
                label='Ask our AI'
                iconPosition='left'
                icon='fa-solid fa-headset'
                action={ () => requireAuth(() => setIsOpen(true)) }
                externalStyles={ styles['button'] }
            />
        </>
    );
};

export default GeminiAIChatbot;