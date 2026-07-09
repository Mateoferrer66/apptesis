import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, HelpCircle } from 'lucide-react';

const WhatsAppIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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
      {/* Botones flotantes (WhatsApp y Bot) */}
      <div className="fixed bottom-[130px] right-4 z-50 flex flex-row gap-3 md:bottom-[100px]">
        
        {/* WhatsApp Call to Action */}
        <motion.a
          href="https://wa.me/573005059987"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#25D366] text-white p-3.5 rounded-full shadow-lg flex items-center justify-center border-2 border-white/40 ring-4 ring-[#25D366]/20 transition-all hover:shadow-[#25D366]/40 hover:shadow-2xl group relative"
        >
          <WhatsAppIcon className="w-6 h-6" />
          
          {/* Tooltip */}
          <span className="absolute right-full mr-3 bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-100">
            Soporte WhatsApp
          </span>
        </motion.a>

        {/* Botón AgroBot */}
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-3.5 rounded-full shadow-lg flex items-center justify-center border-2 border-white/40 ring-4 ring-green-500/20 transition-all hover:shadow-green-500/40 hover:shadow-2xl group relative"
        >
          <Bot className="w-6 h-6" />
          
          {/* Tooltip */}
          <span className="absolute right-full mr-3 bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-100">
            Asistente Virtual
          </span>
        </motion.button>
      </div>

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
