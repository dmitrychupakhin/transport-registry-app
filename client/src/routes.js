import Auth from './pages/Auth';
import RegisterNaturalOwner from './pages/RegistrationNaturalOwner'
import RegisterLegalOwner from './pages/RegistrationLegalOwner'
import RegisterEmployee from './pages/RegistrationEmployee';
import NotFound from './pages/NotFound';
import DepartmentPage from './pages/Admin/DepartmentPage';
import { 
  LOGIN_ROUTE, 
  REGISTER_NATURAL_ROUTE,
  REGISTER_LEGAL_ROUTE, 
  REGISTRATION_EMPLOYEE_ROUTE,
  DEPARTMENTS_ROUTE
} from "./utils/consts";

export const authRoutes = [
  {
    path: DEPARTMENTS_ROUTE,
    Component: DepartmentPage
  }
];

export const publicRoutes = [
  {
    path: LOGIN_ROUTE,
    Component: Auth
  },
  {
    path: REGISTER_NATURAL_ROUTE,
    Component: RegisterNaturalOwner
  },
  {
    path: REGISTER_LEGAL_ROUTE,
    Component: RegisterLegalOwner
  },
  {
    path: REGISTRATION_EMPLOYEE_ROUTE,
    Component: RegisterEmployee
  },
  {
    path: '*',
    Component: NotFound
  }
];