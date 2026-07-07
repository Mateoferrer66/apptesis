import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, HelpCircle } from 'lucide-react';

export const AgroBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '¡Hola! Soy AgroBot. ¿En qué te puedo ayudar hoy con tus cultivos?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Respuesta simple basada en reglas (ya que no hay API LLM definida)
    setTimeout(() => {
      let botResponse = 'Lo siento, no entendí tu consulta. Por favor intenta ser más específico.';
      const lowerInput = userMessage.text.toLowerCase();
      
      if (lowerInput.includes('broca')) {
        botResponse = 'La Broca del café (Hypothenemus hampei) ataca los frutos. Te sugiero usar trampas y realizar las recolecciones (re-re) adecuadamente.';
      } else if (lowerInput.includes('roya')) {
        botResponse = 'La Roya (Hemileia vastatrix) es un hongo. Revisa el envés de las hojas buscando polvo naranja. Aplica fungicidas si la incidencia es alta.';
      } else if (lowerInput.includes('hola') || lowerInput.includes('saludos')) {
        botResponse = '¡Hola! ¿Has realizado alguna inspección hoy? Recuerda que puedes usar el escáner para tomar fotos.';
      } else if (lowerInput.includes('sincronizar') || lowerInput.includes('internet') || lowerInput.includes('offline')) {
        botResponse = 'Puedes trabajar offline. Cuando tengas internet, ve a la parte superior y presiona el botón "Sincronizar" para guardar todo.';
      } else if (lowerInput.includes('minador')) {
        botResponse = 'El Minador de la hoja hace galerías dentro de las hojas. El control preventivo es clave.';
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
    }, 800);
  };

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-5 z-40 bg-gradient-to-r from-emerald-500 to-green-600 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 ring-4 ring-green-500/20 md:bottom-6"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Ventana del Chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-0 right-0 w-full h-[85vh] md:h-[500px] md:w-[380px] md:bottom-24 md:right-5 z-50 bg-white shadow-2xl md:rounded-3xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">AgroBot</h3>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-green-100">Asistente Virtual</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
              {messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Sugerencias Rápidas */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto hide-scrollbar">
              <button onClick={() => setInput('¿Qué hago con la broca?')} className="shrink-0 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors">
                Broca
              </button>
              <button onClick={() => setInput('¿Cómo identifico la roya?')} className="shrink-0 text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors">
                Roya
              </button>
              <button onClick={() => setInput('¿Cómo funciona offline?')} className="shrink-0 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors">
                Modo Offline
              </button>
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 bg-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
