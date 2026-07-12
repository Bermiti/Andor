'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, Compass, MessageSquare, DollarSign, ArrowUpRight, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import styles from './backoffice.module.css';
import { getStoredJourneyTrips } from '../lib/itinerary-store';

export default function BackofficeDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [trips, setTrips] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [agentName, setAgentName] = useState('Agente Andor');

  useEffect(() => {
    // Fetch all stored trips from Local/Session Storage via store wrapper
    if (typeof window !== 'undefined') {
      const stored = getStoredJourneyTrips() || [];
      setTrips(stored);
    }

    // Seed mock live chat conversations
    setConversations([
      {
        id: 'chat-1',
        clientName: 'Pedro Silva',
        destination: 'Lisboa, Portugal',
        lastMessage: 'Queria saber se o restaurante O Velho Eurico necessita de reserva obrigatória?',
        time: 'Há 5 min',
        unread: true,
        messages: [
          { sender: 'client', text: 'Olá! Já estou em Lisboa com o itinerário da Andor.' },
          { sender: 'bot', text: 'Olá, Pedro! Espero que estejas a gostar de Alfama. Como posso ajudar?' },
          { sender: 'client', text: 'Queria saber se o restaurante O Velho Eurico necessita de reserva obrigatória?' },
        ]
      },
      {
        id: 'chat-2',
        clientName: 'Ana Martins',
        destination: 'Tokyo, Japão',
        lastMessage: 'Podem confirmar se o Shuttle do aeroporto já está pago?',
        time: 'Há 1 hora',
        unread: false,
        messages: [
          { sender: 'client', text: 'Boa tarde! O voo correu muito bem.' },
          { sender: 'bot', text: 'Excelente, Ana! O teu transfer privado estará à tua espera nas chegadas.' },
          { sender: 'client', text: 'Podem confirmar se o Shuttle do aeroporto já está pago?' },
        ]
      }
    ]);
  }, []);

  // Compute stats
  const totalVolume = trips.reduce((acc, t) => {
    const cost = parseFloat(String(t.totalCost || '0').replace(/[^\d]/g, ''));
    return acc + (isNaN(cost) ? 0 : cost);
  }, 3420); // base seed for dashboard realism

  const totalCommissions = Math.round(totalVolume * 0.08); // 8% avg commission
  const conversionRate = trips.length > 0 ? Math.round((trips.filter(t => t.operationalStatus?.bookings?.isComplete).length / trips.length) * 100) : 40;

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConversation) return;

    const updated = conversations.map(c => {
      if (c.id === selectedConversation.id) {
        const nextMessages = [...c.messages, { sender: 'agent', text: replyText }];
        return {
          ...c,
          messages: nextMessages,
          lastMessage: replyText,
          time: 'Agora',
          unread: false
        };
      }
      return c;
    });

    setConversations(updated);
    setSelectedConversation(updated.find(c => c.id === selectedConversation.id));
    setReplyText('');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <>
      <Navbar />
      <div className={styles.backofficeContainer}>
        {/* SIDE NAVIGATION */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.goldBadge}>Staff</span>
            <h3>Backoffice Andor</h3>
          </div>
          <nav className={styles.sideNav}>
            <button
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={18} />
              <span>Painel Geral</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'itineraries' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('itineraries')}
            >
              <Compass size={18} />
              <span>Itinerários ({trips.length})</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'concierge' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('concierge')}
            >
              <MessageSquare size={18} />
              <span>Concierge Chat</span>
              {conversations.some(c => c.unread) && <span className={styles.unreadDot} />}
            </button>
          </nav>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className={styles.mainContent}>
          {activeTab === 'overview' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Vista Geral da Agência</h2>
                <p>Estatísticas operacionais, volume de vendas e desempenho de comissões.</p>
              </div>

              {/* STAT CARDS */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIconWrapper}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span>Volume Transacionado</span>
                    <h3>{formatCurrency(totalVolume)}</h3>
                    <div className={styles.statGrowth}>
                      <TrendingUp size={14} />
                      <span>+12.4% este mês</span>
                    </div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIconWrapper}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span>Comissões Estimadas</span>
                    <h3>{formatCurrency(totalCommissions)}</h3>
                    <div className={styles.statGrowth}>
                      <TrendingUp size={14} />
                      <span>8% taxa média</span>
                    </div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIconWrapper}>
                    <Users size={20} />
                  </div>
                  <div>
                    <span>Taxa de Conversão</span>
                    <h3>{conversionRate}%</h3>
                    <div className={styles.statGrowth}>
                      <CheckCircle size={14} />
                      <span>Meta de 50%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT BUSINESS ACTIVITY */}
              <div className={styles.dashboardSection}>
                <h3>Reservas Recentes</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Destino</th>
                        <th>Viajante / Estilo</th>
                        <th>Estado de Reservas</th>
                        <th>Valor Orçamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.length === 0 ? (
                        <tr>
                          <td colSpan="4" className={styles.noData}>Nenhuma reserva ativa registada de momento.</td>
                        </tr>
                      ) : (
                        trips.map((trip) => {
                          const ready = trip.operationalStatus?.bookings?.ready || 0;
                          const total = trip.operationalStatus?.bookings?.total || 0;
                          return (
                            <tr key={trip.id}>
                              <td>
                                <strong>{trip.destination}</strong>
                                <span className={styles.tripSub}>{trip.title}</span>
                              </td>
                              <td>
                                <span>{trip.style || 'Lazer'}</span>
                              </td>
                              <td>
                                <span className={ready === total && total > 0 ? styles.statusConfirmed : styles.statusPending}>
                                  {ready}/{total} Confirmados
                                </span>
                              </td>
                              <td>
                                <strong>{trip.totalCost || 'N/A'}</strong>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'itineraries' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Gestão de Roteiros Ativos</h2>
                <p>Lista completa de todos os planos de viagem criados pelos utilizadores no sistema.</p>
              </div>

              <div className={styles.tripsGrid}>
                {trips.length === 0 ? (
                  <p className={styles.emptyText}>Sem itinerários para mostrar.</p>
                ) : (
                  trips.map((trip) => (
                    <div key={trip.id} className={styles.tripListItem}>
                      <div className={styles.tripListHeader}>
                        <div>
                          <h4>{trip.destination}</h4>
                          <span>ID: {trip.id}</span>
                        </div>
                        <a href={`/itinerary/${trip.id}`} className={styles.tripLink}>
                          Ver Roteiro <ArrowUpRight size={14} />
                        </a>
                      </div>
                      <div className={styles.tripListInfo}>
                        <div>
                          <span>Estilo</span>
                          <strong>{trip.style || 'Cultural'}</strong>
                        </div>
                        <div>
                          <span>Duração</span>
                          <strong>{trip.daysCount || trip.days?.length || 1} dias</strong>
                        </div>
                        <div>
                          <span>Checklist Reservas</span>
                          <strong>{trip.operationalStatus?.bookings?.ready || 0}/{trip.operationalStatus?.bookings?.total || 0}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'concierge' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Suporte Concierge Live</h2>
                <p>Intervenção humana direta nas conversas de chat iniciadas com o Andor Concierge.</p>
              </div>

              <div className={styles.chatWorkspace}>
                {/* CONVERSATION LIST */}
                <div className={styles.chatList}>
                  {conversations.map((chat) => (
                    <div
                      key={chat.id}
                      className={`${styles.chatListItem} ${selectedConversation?.id === chat.id ? styles.chatListItemActive : ''}`}
                      onClick={() => {
                        setSelectedConversation(chat);
                        chat.unread = false;
                      }}
                    >
                      <div className={styles.chatListMeta}>
                        <strong>{chat.clientName}</strong>
                        <span>{chat.time}</span>
                      </div>
                      <span className={styles.chatListDest}>{chat.destination}</span>
                      <p className={styles.chatListPreview}>{chat.lastMessage}</p>
                      {chat.unread && <span className={styles.chatUnreadBadge} />}
                    </div>
                  ))}
                </div>

                {/* ACTIVE CHAT WINDOW */}
                <div className={styles.chatWindow}>
                  {selectedConversation ? (
                    <>
                      <div className={styles.chatWindowHeader}>
                        <div>
                          <h4>{selectedConversation.clientName}</h4>
                          <span>A viajar por {selectedConversation.destination}</span>
                        </div>
                      </div>

                      <div className={styles.chatWindowBody}>
                        {selectedConversation.messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`${styles.messageBubble} ${
                              msg.sender === 'client'
                                ? styles.bubbleClient
                                : msg.sender === 'agent'
                                ? styles.bubbleAgent
                                : styles.bubbleBot
                            }`}
                          >
                            <span className={styles.messageSender}>
                              {msg.sender === 'client'
                                ? selectedConversation.clientName
                                : msg.sender === 'agent'
                                ? 'Agente (Tu)'
                                : 'Andor Concierge (IA)'}
                            </span>
                            <p>{msg.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className={styles.chatWindowFooter}>
                        <input
                          type="text"
                          placeholder="Responde ao cliente..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                          className={styles.chatInput}
                        />
                        <button className={styles.chatSendBtn} onClick={handleSendReply}>
                          Responder
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={styles.chatEmpty}>
                      <MessageSquare size={36} />
                      <p>Seleciona um cliente no painel esquerdo para assumir o chat ou dar assistência.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
