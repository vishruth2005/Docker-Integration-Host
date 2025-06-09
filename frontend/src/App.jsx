// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ContainerDetail from './pages/ContainerDetail';
import CreateHost from './pages/CreateHost';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/:host_id/:container_id" element={<ContainerDetail />} />
        <Route path="/hosts/create/" element={<CreateHost />} />
      </Routes>
    </Router>
  );
}

export default App;
