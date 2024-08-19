import React, { useEffect } from 'react';
import Head from 'next/head';
import PrimaryButton from "components/button/primaryButton";
import { useTranslation } from 'react-i18next';

const LiveChat: React.FC = () => {
    const { t } = useTranslation();
  
    useEffect(() => {
      (function(d, w: any, c: string) {
        w.BrevoConversationsID = '6685242671946f775469fddb';
        w[c] = w[c] || function() {
          (w[c].q = w[c].q || []).push(arguments);
        };
        const s = d.createElement('script');
        s.async = true;
        s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
        if (d.head) d.head.appendChild(s);
      })(document, window, 'BrevoConversations');
    }, []);
  
    const expandChat = () => {
      const w = window as any;
      if (w.BrevoConversations && typeof w.BrevoConversations.expandWidget === 'function') {
        w.BrevoConversations.openChat();
      }
    };
  
    return (
      <>
        <Head>
          <title>Live Chat</title>
        </Head>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
          <h1>Got a question?</h1>
          <p>Speak to our dedicated customer service team.</p>
          <p>Available from 10:00 to 22:00 UAE time.</p>
          <div style={{ width: '40%' }}>
            <PrimaryButton onClick={expandChat}>
              {t("Start Chat")}
            </PrimaryButton>
          </div>
        </div>
      </>
    );
  };
  
  export default LiveChat;
