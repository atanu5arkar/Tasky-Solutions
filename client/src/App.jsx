import { BrowserRouter, Routes, Route } from 'react-router';

import './App.css';
import LandingPage from './Landing.jsx';
import Signup from './Signup.jsx';
import Login from './Login.jsx';
import Dashboard from './Individual/Dashboard.jsx';
import TaskList from './Individual/Tasks.jsx';
import PrivateRoute from './PrivateRoute.jsx';
import OrgDashboard from './Organization/OrgDashboard.jsx';
import { Profile } from './Individual/Profile.jsx';
import UserState from './Individual/contexts/userState.jsx';
import AlertState from './Alert/alertState.jsx';
import { AddTaskBtn } from './Individual/AddTask.jsx';
import { Verification, AlreadyVerified, Error, Success } from './Verification.jsx';
import NotFound from './NotFound.jsx';
import OrgState from './Organization/contexts/orgState.jsx';
import { OrgProfile } from './Organization/OrgProfile.jsx';
import { AddProjBtn } from './Organization/AddProject.jsx';
import { TeamList } from './Organization/Teams.jsx';
import { MemberList } from './Organization/Members.jsx';
import { ProjectList } from './Organization/Projects.jsx';
import PaymentState from './Payment/payState.jsx';

function App() {

    return (
        <main className="font-[Inter] bg-gray-50">
            <AlertState>
                <PaymentState>
                    <UserState>
                        <OrgState>
                            <BrowserRouter>
                                <Routes>
                                    <Route
                                        path="/"
                                        element={
                                            <LandingPage />
                                        }
                                    />
                                    <Route
                                        path="signup"
                                        element={
                                            <Signup />
                                        }
                                    />

                                    {/* Email and Phone Verification */}
                                    <Route
                                        path="verify-links/:type"
                                        element={
                                            <Verification />
                                        }
                                    >
                                        <Route
                                            path="success"
                                            element={
                                                <Success />
                                            }
                                        />
                                        <Route
                                            path="conflict"
                                            element={
                                                <AlreadyVerified />
                                            }
                                        />
                                        <Route
                                            path="error"
                                            element={
                                                <Error />
                                            }
                                        />
                                    </Route>

                                    <Route
                                        path="login"
                                        element={
                                            <Login />
                                        }
                                    />

                                    {/* Routing for an Individual */}
                                    <Route
                                        path="user"
                                        element={
                                            <PrivateRoute
                                                element={Dashboard}
                                            />
                                        }
                                    >
                                        <Route
                                            index
                                            element={
                                                <AddTaskBtn />
                                            }
                                        />
                                        <Route
                                            path="profile"
                                            element={
                                                <Profile />
                                            }
                                        />
                                        <Route
                                            path="tasks"
                                            element={
                                                <TaskList />
                                            }
                                        />
                                    </Route>

                                    {/* Routing for an Org */}
                                    <Route
                                        path="org"
                                        element={
                                            <PrivateRoute
                                                element={OrgDashboard}
                                            />
                                        }
                                    >
                                        <Route
                                            index
                                            element={
                                                <AddProjBtn />
                                            }
                                        />
                                        <Route
                                            path='projects'
                                            element={
                                                <ProjectList />
                                            }
                                        />
                                        <Route
                                            path="teams"
                                            element={
                                                <TeamList />
                                            }
                                        />
                                        <Route
                                            path="members"
                                            element={
                                                <MemberList />
                                            }
                                        />
                                        <Route
                                            path="profile"
                                            element={
                                                <OrgProfile />
                                            }
                                        />
                                    </Route>

                                    <Route
                                        path="*"
                                        element={
                                            <NotFound />
                                        }
                                    />
                                </Routes>
                            </BrowserRouter>
                        </OrgState>
                    </UserState>
                </PaymentState>
            </AlertState>

        </main>
    );
}

export default App;
