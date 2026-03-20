import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Quizzes } from './pages/Quizzes';
import { Notebook } from './pages/Notebook';
import { CodingGround } from './pages/CodingGround';
import { AvatarTutor } from './pages/AvatarTutor';
import { Settings } from './pages/Settings';
import { Quests } from './pages/Quests';
import { Achievements } from './pages/Achievements';
import { Leaderboard } from './pages/Leaderboard';
import { PowerUpShop } from './pages/PowerUpShop';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/code" element={<CodingGround />} />
          <Route path="/tutor" element={<AvatarTutor />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/shop" element={<PowerUpShop />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;