'use client';
import styles from './Feed.module.css';
import { useState } from 'react';
import Passport from './Passport';

const tabs = ['🔥 Trending', '👥 Buddies', '⭐ Top Rated', '🆕 New', '💰 Budget', '🌍 Europe', '🌏 Asia'];

const stories = [
  { id: 1, name: 'Your Story', avatar: '➕', live: false },
  { id: 2, name: 'Maria S.', avatar: '👩‍🎨', live: true },
  { id: 3, name: 'Alex K.', avatar: '👨‍🚀', live: true },
  { id: 4, name: 'Yuki T.', avatar: '🎎', live: false },
  { id: 5, name: 'Carlos R.', avatar: '🇪🇸', live: true },
  { id: 6, name: 'Sophie L.', avatar: '🇫🇷', live: false },
];

const INITIAL_POSTS = [
  {
    id: 1,
    author: 'Alex Rivera',
    avatar: '👨‍🚀',
    location: 'Sintra, Portugal',
    image: '/images/swiss.png',
    caption: "Found this incredible hidden castle today. The AI suggested the perfect time to visit to avoid the crowds. Truly magical! ✨",
    likes: 124,
    comments: 18,
    remixes: 42,
    time: '2h ago'
  },
  {
    id: 2,
    author: 'Elena K.',
    avatar: '🧘‍♀️',
    location: 'Kyoto, Japan',
    image: '/images/tokyo.png',
    caption: "Morning zen at Fushimi Inari. My Andor assistant guided me through the secret trails. 🏮",
    likes: 892,
    comments: 56,
    remixes: 128,
    time: '5h ago'
  },
  {
    id: 3,
    author: 'Marcus J.',
    avatar: '👨‍💻',
    location: 'Paris, France',
    image: '/images/paris.png',
    caption: "Dinner with a view. Andor booked this table 3 months ago when I first planned the trip. Zero stress.",
    likes: 2.1,
    comments: 89,
    remixes: 310,
    time: '1d ago'
  }
];

export default function Feed() {
  const [posts, setPosts] = useState(INITIAL_POSTS);

  return (
    <section className={styles.feedSection}>
      <div className={styles.header}>
        <span className="section-label">✨ The Feed</span>
        <h2 className="section-title">Explore the World's Best Trips</h2>
        <p className="section-subtitle mx-auto">
          See what others are exploring, remix their itineraries, and share your own journeys with the world.
        </p>
      </div>

      <div className={styles.container}>
        <div className={styles.mainColumn}>
          <div className={styles.storiesBar}>
            {stories.map(story => (
              <div key={story.id} className={styles.story}>
                <div className={`${styles.storyAvatar} ${story.live ? styles.live : ''}`}>
                  {story.avatar}
                </div>
                <span className={styles.storyName}>{story.name}</span>
              </div>
            ))}
          </div>

          <div className={styles.posts}>
          {posts.map(post => (
            <div key={post.id} className={styles.post}>
              <div className={styles.postHeader}>
                <div className={styles.authorInfo}>
                  <div className={styles.avatar}>{post.avatar}</div>
                  <div>
                    <h4 className={styles.authorName}>{post.author}</h4>
                    <p className={styles.postMeta}>📍 {post.location} • {post.time}</p>
                  </div>
                </div>
                <button className={styles.followBtn}>Follow</button>
              </div>

              <div className={styles.postImage} style={{ backgroundImage: `url(${post.image})` }}>
                <div className={styles.imageOverlay}>
                  <button className={styles.remixBadge}>✨ Remix This Trip</button>
                </div>
              </div>

              <div className={styles.postBody}>
                <p className={styles.caption}>{post.caption}</p>
                <div className={styles.postActions}>
                  <div className={styles.mainActions}>
                    <button className={styles.actionBtn}>❤️ {post.likes}K</button>
                    <button className={styles.actionBtn}>💬 {post.comments}</button>
                    <button className={styles.actionBtn}>🔄 {post.remixes} Remixes</button>
                  </div>
                  <button className={styles.saveBtn}>🔖 Save</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

        <aside className={styles.sidebar}>
          <Passport />
          
          <div className={styles.trendingCard}>
            <h3 className={styles.sidebarTitle}>Trending Destinations</h3>
            <div className={styles.trendingList}>
              <div className={styles.trendingItem}>
                <span className={styles.rank}>1</span>
                <span>Lisbon, Portugal</span>
              </div>
              <div className={styles.trendingItem}>
                <span className={styles.rank}>2</span>
                <span>Tokyo, Japan</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
