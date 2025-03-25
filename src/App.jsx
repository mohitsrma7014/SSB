import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import NotFoundPage from './pages/Login/NotFoundPage';
import Admin_Home from './pages/Admin/Home';
import Raw_Material_Home1 from './pages/Raw_Material/Home';
import Raw_Material_Home from './pages/Raw_Material/components/Dashboard';
import BalanceAfterHold from './pages/Raw_Material/components/BalanceAfterHold';
import Masterdatrm from './pages/Raw_Material/components/Single';
import Raw_material_update from './pages/Raw_Material/components/Raw_material_update';
import RawMaterialForm from './pages/Raw_Material/components/Rm_reciving';
import BatchForm from './pages/Raw_Material/components/Issu';
import Issu_list from './pages/Raw_Material/components/Issu_list';
import CreateOrder from "./pages/Raw_Material/Materialorder/CreateOrder";
import { Orders } from "./pages/Raw_Material/Materialorder/Orders";
import BlockmtForm1 from "./pages/Raw_Material/components/BlockmtForm1";
import PlanningUpdates from "./pages/Raw_Material/components/Planning_updates";
import PlanningUpdates1 from "./pages/Raw_Material/components/Planning_updates1";

import ScheduleForm from './pages/Admin/ScheduleForm';
import Schedule from './pages/Admin/Schedule';
import Ratingmain from './pages/Admin/Components/Ratingmain';

import DispatchList from './pages/Dispatch/DispatchList';
import TraceabilityCard from './pages/Tracibility/TraceabilityCard';
import TraceabilityCard1 from './pages/Tracibility/TraceabilityCard2';

import Dashboard from './pages/Quality/Dashboard';
import FinancialTrends from './pages/Quality/FinancialTrends';
import Forging from './pages/Quality/Forging';

import Master_list_list from './pages/Masterlist/Master_list_list';

import Calibration from './pages/Calibration/Calibration';
import RejectedCalibration from './pages/Calibration/Rejcted_instruments';
import UIDGenerator from './pages/Calibration/UIDGenerator';

import Batch_Cheq from './pages/Others/Batch_Cheq';

import Forging_Home from './pages/Forging/Forging_Home';
import Forging_Form from './pages/Forging/Forging_Form';
import Forging_List from './pages/Forging/Forging_List';
import Forging_Production from './pages/Forging/Forging_Production';

import Heat_Treatment_Home from './pages/Heat_Treatment/Heat_Treatment_Home';
import Heat_Treatment_Production from './pages/Heat_Treatment/Heat_Treatment_Production';
import Heat_Treatment_form from './pages/Heat_Treatment/Heat_Treatment_form';

import Pre_mc_form from './pages/Pre_mc/Pre_mc_form';
import Pre_mc_production from './pages/Pre_mc/Pre_mc_production';

import Cnc_home from './pages/Cnc/Cnc_home';
import Cnc_form from './pages/Cnc/Cnc_form';
import Cnc_Production from './pages/Cnc/Cnc_Production';
import Cnc_list from './pages/Cnc/Cnc_list';

import Marking_home from './pages/Marking/Marking_home';
import Marking_form from './pages/Marking/Marking_form';
import Marking_Production from './pages/Marking/Marking_Production';

import Fi_home from './pages/Fi/Fi_home';
import Fi_form from './pages/Fi/Fi_form';
import Fi_Production from './pages/Fi/Fi_Production';

import Visual_home from './pages/Visual/Visual_home';
import Visual_Form from './pages/Visual/Visual_Form';
import Visual_production from './pages/Visual/Visual_production';

import Dispatch_home from './pages/Dispatch/Dispatch_home';
import Dispatch_form from './pages/Dispatch/Dispatch_form';

import Engineering_home from './pages/Engineering/Engineering_home';




const App = () => {
  const isAuthenticated = () => !!localStorage.getItem('accessToken'); // Check if access token exists

  const departmentComponents = {
    admin: Admin_Home,
    rm: Raw_Material_Home,
    forging: Forging_Home,
    ht: Heat_Treatment_Home,
    cnc: Cnc_home,
    marking: Marking_home,
    fi: Fi_home,
    visual: Visual_home,
    dispatch: Dispatch_home,
    engineering: Engineering_home,
  };

  // Check for token validity in localStorage
  const isTokenValid = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const tokenExpDate = JSON.parse(atob(token.split('.')[1])).exp; // Decode JWT token
      if (tokenExpDate < Date.now() / 1000) {
        localStorage.removeItem('accessToken'); // Remove expired token
        return false;
      }
      return true;
    }
    return false;
  };

  const DepartmentRouter = () => {
    const { departmentName } = useParams();
    const DepartmentComponent = departmentComponents[departmentName.toLowerCase()] || NotFoundPage;
    
    return isTokenValid() ? <DepartmentComponent /> : <Navigate to="/login" replace />;
  };

  return (
      <Routes>
        <Route path="/department" element={isTokenValid() ? <Navigate to="/home" replace /> : <LoginPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/department/:departmentName" element={<DepartmentRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/BalanceAfterHold/" element={<BalanceAfterHold />} />
        <Route path="/Masterdatrm/" element={<Masterdatrm />} />

        <Route path="/ScheduleForm/" element={<ScheduleForm />} />
        <Route path="/Schedule/" element={<Schedule />} />
        <Route path="/Ratingmain/" element={<Ratingmain />} />

        <Route path="/DispatchList/" element={<DispatchList />} />

        <Route path="/TraceabilityCard/" element={<TraceabilityCard />} />
        <Route path="/TraceabilityCard1/" element={<TraceabilityCard1 />} />

        <Route path="/Dashboard/" element={<Dashboard />} />
        <Route path="/FinancialTrends/" element={<FinancialTrends />} />
        <Route path="/Forging/" element={<Forging />} />
        <Route path="/Raw_material_update/" element={<Raw_material_update />} />
        <Route path="/RawMaterialForm/" element={<RawMaterialForm />} />
        <Route path="/Issu/" element={<BatchForm />} />
        <Route path="/Issu_list/" element={<Issu_list />} />
        <Route path="/CreateOrder/" element={<CreateOrder />} />
        <Route path="/Orders/" element={<Orders />} />
        <Route path="/BlockmtForm1/" element={<BlockmtForm1 />} />
        <Route path="/PlanningUpdates/" element={<PlanningUpdates />} />
        <Route path="/PlanningUpdates1/" element={<PlanningUpdates1 />} />

        <Route path="/Master_list_list1/" element={<Master_list_list />} />

        <Route path="/Calibration/" element={<Calibration />} />
        <Route path="/RejectedCalibration/" element={<RejectedCalibration />} />
        <Route path="/UIDGenerator/" element={<UIDGenerator />} />

        <Route path="/Batch_Cheq/" element={<Batch_Cheq />} />

        <Route path="/Forging_Form/" element={<Forging_Form />} />
        <Route path="/Forging_List/" element={<Forging_List />} />
        <Route path="/Forging_Production/" element={<Forging_Production />} />

        <Route path="/Heat_Treatment_Production/" element={<Heat_Treatment_Production />} />
        <Route path="/Heat_Treatment_form/" element={<Heat_Treatment_form />} />

        <Route path="/Pre_mc_form/" element={<Pre_mc_form />} />
        <Route path="/Pre_mc_production/" element={<Pre_mc_production />} />

        <Route path="/Cnc_form/" element={<Cnc_form />} />
        <Route path="/Cnc_Production/" element={<Cnc_Production />} />
        <Route path="/Cnc_list/" element={<Cnc_list />} />

        <Route path="/Marking_form/" element={<Marking_form />} />
        <Route path="/Marking_Production/" element={<Marking_Production />} />
        

        <Route path="/Fi_form/" element={<Fi_form />} />
        <Route path="/Fi_Production/" element={<Fi_Production />} />
       

        <Route path="/Visual_Form/" element={<Visual_Form />} />
        <Route path="/Visual_production/" element={<Visual_production />} />

        <Route path="/Dispatch_form/" element={<Dispatch_form />} />

      </Routes>
  );
};

export default App;
