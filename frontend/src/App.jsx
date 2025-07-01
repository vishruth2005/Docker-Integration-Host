// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ContainerDetail from './pages/ContainerDetail';
import CreateHost from './pages/CreateHost';
import CreateContainer from './pages/CreateContainer';
import HostDetail from './pages/HostDetail';
import CreateNetwork from './pages/CreateNetwork';
import ManageNetworks from './pages/ManageNetworks';
import CreateVolume from './pages/CreateVolume';
import ManageVolumes from './pages/ManageVolumes';
import Splash from './pages/Splash';
import HostSelect from './pages/HostSelect';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/:host_id/:container_id" element={<ContainerDetail />} />
        <Route path="/hosts/create/" element={<CreateHost />} />
        <Route path="/hosts/:host_id/containers/create/" element={<CreateContainer />} />
        <Route path="/hosts/:host_id/containers" element={<HostDetail />} />
        <Route path="/hosts/:hostId/networks/create" element={<CreateNetwork />} />
        <Route path="/hosts/:hostId/networks" element={<ManageNetworks />} />
        <Route path="hosts/:host_id/volumes/create/" element={<CreateVolume />} />
        <Route path="hosts/:host_id/volumes/" element={<ManageVolumes />} />
        <Route path="/hosts/:host_id/select/" element={<HostSelect />} />
      </Routes>
    </Router>
  );
}

export default App;
