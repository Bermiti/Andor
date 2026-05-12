'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './TravelBuddies.module.css';

const sampleBuddies = [
  { id: '1', name: 'Sofia C.', bio: 'Adoro mergulho e explorar ilhas. Próximo destino: Grécia!', interests: ['Beach', 'Adventure', 'Photography'], destination: 'Grécia', avatar: '🧜‍♀️' },
  { id: '2', name: 'Marco T.', bio: 'Foodie e apaixonado por história. Sempre à procura de companhia para roadtrips.', interests: ['Food', 'History', 'Architecture'], destination: 'Itália', avatar: '🧑‍🍳' },
  { id: '3', name: 'Lena K.', bio: 'Digital nomad. Trabalho de cafés bonitos pelo mundo.', interests: ['Nightlife', 'Art', 'Shopping'], destination: 'Bali', avatar: '💻' },
  { id: '4', name: 'André M.', bio: 'Backpacker desde os 18. Já visitei 40 países. Próximo: Japão!', interests: ['Adventure', 'Nature', 'Food'], destination: 'Japão', avatar: '🎒' },
  { id: '5', name: 'Clara R.', bio: 'Amo museus, galerias e vinho. Procuro alguém para visitar Bordeaux.', interests: ['Art', 'History', 'Food'], destination: 'França', avatar: '🎨' },
  { id: '6', name: 'Diogo P.', bio: 'Surf, campismo e montanha. Próxima aventura: Islândia!', interests: ['Adventure', 'Nature', 'Photography'], destination: 'Islândia', avatar: '🏄' },
];

const allInterests = ['History', 'Nature', 'Architecture', 'Shopping', 'Food', 'Nightlife', 'Art', 'Photography', 'Beach', 'Adventure'];

export default function TravelBuddies() {
  const { user, updateUser } = useAuth();
  const [filterInterest, setFilterInterest] = useState('');
  const [filterDest, setFilterDest] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [myInterests, setMyInterests] = useState(user?.interests || []);

  const isLooking = user?.lookingForBuddy || false;

  const toggleLooking = () => {
    updateUser({ lookingForBuddy: !isLooking });
  };

  const saveProfile = () => {
    updateUser({ bio, interests: myInterests });
    setEditingProfile(false);
  };

  const toggleInterest = (interest) => {
    setMyInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const filtered = sampleBuddies.filter(b => {
    if (filterInterest && !b.interests.includes(filterInterest)) return false;
    if (filterDest && !b.destination.toLowerCase().includes(filterDest.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Your Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileCardHeader}>
          <div className={styles.profileAvatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.profileDetails}>
            <div className={styles.profileName}>{user?.name}</div>
            <div className={styles.profileBio}>{user?.bio || 'Sem bio ainda...'}</div>
          </div>
          <div className={styles.profileActions}>
            <button
              className={`${styles.lookingToggle} ${isLooking ? styles.lookingActive : ''}`}
              onClick={toggleLooking}
            >
              {isLooking ? '✓ Visível' : 'Ativar Perfil'}
            </button>
            <button className={styles.editBtn} onClick={() => setEditingProfile(!editingProfile)}>
              ✏️
            </button>
          </div>
        </div>

        {user?.interests?.length > 0 && (
          <div className={styles.profileInterests}>
            {user.interests.map(i => (
              <span key={i} className={styles.interestTag}>{i}</span>
            ))}
          </div>
        )}

        {editingProfile && (
          <div className={styles.editForm}>
            <input
              type="text"
              placeholder="A tua bio (ex: Adoro explorar cidades novas!)"
              className={styles.formInput}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div className={styles.interestsGrid}>
              {allInterests.map(interest => (
                <button
                  key={interest}
                  className={`${styles.interestBtn} ${myInterests.includes(interest) ? styles.interestBtnActive : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
            <button className={styles.saveBtn} onClick={saveProfile}>Guardar Perfil</button>
          </div>
        )}

        {!isLooking && (
          <div className={styles.profileNotice}>
            💡 Ativa o teu perfil para outros viajantes te encontrarem!
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <h3 className={styles.filtersTitle}>Encontrar Parceiros de Viagem</h3>
        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={filterInterest}
            onChange={(e) => setFilterInterest(e.target.value)}
          >
            <option value="">Todos os interesses</option>
            {allInterests.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Filtrar por destino..."
            value={filterDest}
            onChange={(e) => setFilterDest(e.target.value)}
          />
        </div>
      </div>

      {/* Buddies Grid */}
      <div className={styles.buddiesGrid}>
        {filtered.map(buddy => (
          <div key={buddy.id} className={styles.buddyCard}>
            <div className={styles.buddyHeader}>
              <div className={styles.buddyAvatar}>{buddy.avatar}</div>
              <div className={styles.buddyInfo}>
                <div className={styles.buddyName}>{buddy.name}</div>
                <div className={styles.buddyDest}>📍 {buddy.destination}</div>
              </div>
            </div>
            <p className={styles.buddyBio}>{buddy.bio}</p>
            <div className={styles.buddyInterests}>
              {buddy.interests.map(i => (
                <span key={i} className={styles.buddyInterestTag}>{i}</span>
              ))}
            </div>
            <button className={styles.connectBtn}>
              💬 Enviar Mensagem
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={styles.noResults}>
            <p>Nenhum viajante encontrado com esses filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
