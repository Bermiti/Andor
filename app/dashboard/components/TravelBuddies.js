'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './TravelBuddies.module.css';

const sampleBuddies = [
  { id: '1', name: 'Sofia C.', verified: true, bio: 'I love diving and exploring islands. Next destination: Greece!', interests: ['Beach', 'Adventure', 'Photography'], destination: 'Greece', avatar: '🧜‍♀️' },
  { id: '2', name: 'Marco T.', verified: true, bio: 'Foodie and passionate about history. Always looking for company for roadtrips.', interests: ['Food', 'History', 'Architecture'], destination: 'Italy', avatar: '🧑‍🍳' },
  { id: '3', name: 'Lena K.', verified: false, bio: 'Digital nomad. Working from beautiful cafes around the world.', interests: ['Nightlife', 'Art', 'Shopping'], destination: 'Bali', avatar: '💻' },
  { id: '4', name: 'André M.', verified: true, bio: 'Backpacker since 18. Already visited 40 countries. Next: Japan!', interests: ['Adventure', 'Nature', 'Food'], destination: 'Japan', avatar: '🎒' },
  { id: '5', name: 'Clara R.', verified: false, bio: 'I love museums, galleries and wine. Looking for someone to visit Bordeaux.', interests: ['Art', 'History', 'Food'], destination: 'France', avatar: '🎨' },
  { id: '6', name: 'Diogo P.', verified: true, bio: 'Surf, camping and mountain. Next adventure: Iceland!', interests: ['Adventure', 'Nature', 'Photography'], destination: 'Iceland', avatar: '🏄' },
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
            <div className={styles.profileBio}>{user?.bio || 'No bio yet...'}</div>
          </div>
          <div className={styles.profileActions}>
            <button
              className={`${styles.lookingToggle} ${isLooking ? styles.lookingActive : ''}`}
              onClick={toggleLooking}
            >
              {isLooking ? '✓ Visible' : 'Activate Profile'}
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
              placeholder="Your bio (e.g. I love exploring new cities!)"
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
            <button className={styles.saveBtn} onClick={saveProfile}>Save Profile</button>
          </div>
        )}

        {!isLooking && (
          <div className={styles.profileNotice}>
            💡 Activate your profile so other travelers can find you!
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <h3 className={styles.filtersTitle}>Find Travel Partners</h3>
        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={filterInterest}
            onChange={(e) => setFilterInterest(e.target.value)}
          >
            <option value="">All interests</option>
            {allInterests.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Filter by destination..."
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
                <div className={styles.buddyName}>
                  {buddy.name}
                  {buddy.verified && <span className={styles.verifiedBadge} title="Verified Traveler">✓</span>}
                </div>
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
              💬 Send Message
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={styles.noResults}>
            <p>No travelers found with these filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
