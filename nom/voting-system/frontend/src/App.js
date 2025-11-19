import React, { useState, useEffect } from "react";
import {
  Vote,
  Users,
  TrendingUp,
  Shield,
  LogOut,
  User,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  Trash2,
  Download,
  RefreshCw,
  Home,
  Search, // Re-used Search icon
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auth States
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    role: "voter",
  });

  // Voter States
  const [parties, setParties] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [voteStatus, setVoteStatus] = useState({
    hasVoted: false,
    votedParty: null,
  });
  // NEW: Search State for Voter Campaigns
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");

  // Party States
  const [partyProfile, setPartyProfile] = useState(null);
  const [partyCampaigns, setPartyCampaigns] = useState([]);
  const [voteCount, setVoteCount] = useState(0);
  const [newParty, setNewParty] = useState({
    name: "",
    description: "",
    logo_url: "🎯",
  });
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    image_url: "",
  });
  const [campaignImageFile, setCampaignImageFile] = useState(null);
  const [campaignImagePreview, setCampaignImagePreview] = useState(null);

  // Admin States
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [adminParties, setAdminParties] = useState([]);
  const [logs, setLogs] = useState([]);
  // Search State for Admin Users (from previous request)
  const [searchQuery, setSearchQuery] = useState("");

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        setActiveTab(data.user.role);
      }
    } catch (err) {
      console.error("Session check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(""), 5000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(""), 5000);
    }
  };

  // ============ AUTH FUNCTIONS ============
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setActiveTab(data.user.role);
        showMessage("Login successful!");
        setLoginData({ email: "", password: "" });
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Login failed: " + err.message, true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Registration successful! Please login.");
        setActiveTab("login");
        setRegisterData({ name: "", email: "", password: "", role: "voter" });
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Registration failed: " + err.message, true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setActiveTab("login");
      showMessage("Logged out successfully!");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ============ VOTER FUNCTIONS ============
  const loadVoterData = async () => {
    try {
      const [partiesRes, campaignsRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/voter/parties`, { credentials: "include" }),
        fetch(`${API_URL}/voter/campaigns`, { credentials: "include" }),
        fetch(`${API_URL}/voter/status`, { credentials: "include" }),
      ]);
      const partiesData = await partiesRes.json();
      const campaignsData = await campaignsRes.json();
      const statusData = await statusRes.json();
      setParties(partiesData.parties || []);
      setCampaigns(campaignsData.campaigns || []);
      setVoteStatus(statusData);
    } catch (err) {
      showMessage("Failed to load voter data", true);
    }
  };

  const handleVote = async () => {
    if (!selectedParty) {
      showMessage("Please select a party", true);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/voter/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ party_id: selectedParty }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Vote cast successfully!");
        setUser({ ...user, hasVoted: true });
        loadVoterData();
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Vote failed: " + err.message, true);
    }
  };

  // NEW: Filtered Campaigns Logic
  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.title
        .toLowerCase()
        .includes(campaignSearchQuery.toLowerCase()) ||
      campaign.description
        .toLowerCase()
        .includes(campaignSearchQuery.toLowerCase()) ||
      campaign.party_name
        .toLowerCase()
        .includes(campaignSearchQuery.toLowerCase())
  );

  // ============ PARTY FUNCTIONS ============
  const loadPartyData = async () => {
    try {
      const [profileRes, campaignsRes, votesRes] = await Promise.all([
        fetch(`${API_URL}/party/profile`, { credentials: "include" }),
        fetch(`${API_URL}/party/campaigns`, { credentials: "include" }),
        fetch(`${API_URL}/party/votes`, { credentials: "include" }),
      ]);
      const profileData = await profileRes.json();
      const campaignsData = await campaignsRes.json();
      const votesData = await votesRes.json();
      setPartyProfile(profileData.party);
      setPartyCampaigns(campaignsData.campaigns || []);
      setVoteCount(votesData.voteCount || 0);
    } catch (err) {
      console.error("Failed to load party data:", err);
    }
  };

  const handleCreateParty = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/party/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newParty),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Party created successfully!");
        setNewParty({ name: "", description: "", logo_url: "🎯" });
        loadPartyData();
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Party creation failed: " + err.message, true);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    // Convert image to base64 if file is selected
    let imageData = newCampaign.image_url;
    if (campaignImageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        imageData = reader.result;
        await submitCampaign(imageData);
      };
      reader.readAsDataURL(campaignImageFile);
    } else {
      await submitCampaign(imageData);
    }
  };

  const submitCampaign = async (imageData) => {
    try {
      const res = await fetch(`${API_URL}/party/campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newCampaign.title,
          description: newCampaign.description,
          image_url:
            imageData || "https://via.placeholder.com/300x200?text=Campaign",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Campaign created successfully!");
        setNewCampaign({ title: "", description: "", image_url: "" });
        setCampaignImageFile(null);
        setCampaignImagePreview(null);
        loadPartyData();
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Campaign creation failed: " + err.message, true);
    }
  };

  const handleCampaignImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage("Image size should be less than 2MB", true);
        return;
      }
      setCampaignImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCampaignImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePartyLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showMessage("Image size should be less than 2MB", true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_URL}/party/logo/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("Party logo updated successfully!");
        loadPartyData(); // Reload to show new logo
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Logo upload failed: " + err.message, true);
    }
  };

  // ============ ADMIN FUNCTIONS ============
  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes, partiesRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { credentials: "include" }),
        fetch(`${API_URL}/admin/users`, { credentials: "include" }),
        fetch(`${API_URL}/admin/parties`, { credentials: "include" }),
        fetch(`${API_URL}/admin/logs`, { credentials: "include" }),
      ]);
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const partiesData = await partiesRes.json();
      const logsData = await logsRes.json();
      setStats(statsData);
      setUsers(usersData.users || []);
      setAdminParties(partiesData.parties || []);
      setLogs(logsData.logs || []);
    } catch (err) {
      showMessage("Failed to load admin data", true);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/user/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("User deleted successfully!");
        loadAdminData();
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Delete failed: " + err.message, true);
    }
  };

  const handleDeleteParty = async (partyId) => {
    if (!window.confirm("Are you sure you want to delete this party?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/party/${partyId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Party deleted successfully!");
        loadAdminData();
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Delete failed: " + err.message, true);
    }
  };

  const handleResetElection = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset the election? This will delete all votes!"
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/admin/reset`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Election reset successfully!");
        loadAdminData();
      } else {
        showMessage(data.error, true);
      }
    } catch (err) {
      showMessage("Reset failed: " + err.message, true);
    }
  };

  const handleExport = (type) => {
    window.open(`${API_URL}/admin/export/${type}`, "_blank");
  };

  // Filtered Users logic (kept from previous request for completeness)
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load data when tab changes
  useEffect(() => {
    if (user) {
      if (activeTab === "voter") loadVoterData();
      if (activeTab === "party") loadPartyData();
      if (activeTab === "admin") loadAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Messages */}
      {error && (
        <div style={{ ...styles.message, ...styles.error }}>
          <XCircle size={20} /> {error}
        </div>
      )}
      {success && (
        <div style={{ ...styles.message, ...styles.success }}>
          <CheckCircle size={20} /> {success}
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <Vote size={32} />
            <h1>Online Voting System</h1>
          </div>
          {user && (
            <div style={styles.userInfo}>
              <span style={styles.userName}>
                <User size={18} /> {user.name} ({user.role})
              </span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {!user ? (
          /* ========== AUTH SCREENS ========== */
          <div style={styles.authContainer}>
            <div style={styles.authCard}>
              <div style={styles.authTabs}>
                <button
                  onClick={() => setActiveTab("login")}
                  style={{
                    ...styles.authTab,
                    ...(activeTab === "login" ? styles.authTabActive : {}),
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  style={{
                    ...styles.authTab,
                    ...(activeTab === "register" ? styles.authTabActive : {}),
                  }}
                >
                  Register
                </button>
              </div>
              {activeTab === "login" ? (
                <form onSubmit={handleLogin} style={styles.form}>
                  <h2 style={styles.formTitle}>Welcome Back</h2>
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                  <button type="submit" style={styles.submitBtn}>
                    Login
                  </button>
                  <div style={styles.testAccounts}>
                    <p style={styles.testTitle}>Test Accounts:</p>
                    <p>Voter: voter@test.com / voter123</p>
                    <p>Party: party@test.com / party123</p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} style={styles.form}>
                  <h2 style={styles.formTitle}>Create Account</h2>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={registerData.name}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, name: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    style={styles.input}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    style={styles.input}
                    required
                  />
                  <select
                    value={registerData.role}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, role: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="voter">Voter</option>
                    <option value="party">Party</option>
                  </select>
                  <button type="submit" style={styles.submitBtn}>
                    Register
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* ========== DASHBOARD SCREENS ========== */
          <div style={styles.dashboard}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
              <nav style={styles.nav}>
                {user.role === "voter" && (
                  <>
                    <button
                      onClick={() => setActiveTab("voter")}
                      style={{
                        ...styles.navBtn,
                        ...(activeTab === "voter" ? styles.navBtnActive : {}),
                      }}
                    >
                      <Vote size={20} /> Vote
                    </button>
                    <button
                      onClick={() => setActiveTab("campaigns")}
                      style={{
                        ...styles.navBtn,
                        ...(activeTab === "campaigns"
                          ? styles.navBtnActive
                          : {}),
                      }}
                    >
                      <TrendingUp size={20} /> Campaigns
                    </button>
                  </>
                )}
                {user.role === "party" && (
                  <>
                    <button
                      onClick={() => setActiveTab("party")}
                      style={{
                        ...styles.navBtn,
                        ...(activeTab === "party" ? styles.navBtnActive : {}),
                      }}
                    >
                      <Home size={20} /> Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab("party-campaigns")}
                      style={{
                        ...styles.navBtn,
                        ...(activeTab === "party-campaigns"
                          ? styles.navBtnActive
                          : {}),
                      }}
                    >
                      <TrendingUp size={20} /> Campaigns
                    </button>
                  </>
                )}
                {user.role === "admin" && (
                  <>
                    <button
                      onClick={() => setActiveTab("admin")}
                      style={{
                        ...styles.navBtn,
                        ...(activeTab === "admin" ? styles.navBtnActive : {}),
                      }}
                    >
                      <Shield size={20} /> Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("admin-users")}
                      style={{
                        ...styles.navBtn,
                        ...(activeTab === "admin-users"
                          ? styles.navBtnActive
                          : {}),
                      }}
                    >
                      <Users size={20} /> Users
                    </button>
                    <button
                      onClick={() => setActiveTab("admin-parties")}
                      style={{
                        ...styles.navBtn,
                        ...(activeTab === "admin-parties"
                          ? styles.navBtnActive
                          : {}),
                      }}
                    >
                      <BarChart3 size={20} /> Parties
                    </button>
                    <button
                      onClick={() => setActiveTab("admin-logs")}
                      style={{
                        ...styles.navBtn,
                        ...(activeTab === "admin-logs"
                          ? styles.navBtnActive
                          : {}),
                      }}
                    >
                      <FileText size={20} /> Logs
                    </button>
                  </>
                )}
              </nav>
            </aside>

            {/* Content */}
            <div style={styles.content}>
              {/* VOTER DASHBOARD */}
              {activeTab === "voter" && (
                <div>
                  <h2 style={styles.pageTitle}>Cast Your Vote</h2>
                  {voteStatus.hasVoted ? (
                    <div style={styles.votedCard}>
                      <CheckCircle size={48} color="#10b981" />
                      <h3>You have already voted!</h3>
                      {voteStatus.votedParty && (
                        <p>
                          You voted for:{" "}
                          <strong>{voteStatus.votedParty.name}</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={styles.partiesGrid}>
                      {parties.map((party) => (
                        <div
                          key={party.id}
                          onClick={() => setSelectedParty(party.id)}
                          style={{
                            ...styles.partyCard,
                            ...(selectedParty === party.id
                              ? styles.partyCardSelected
                              : {}),
                          }}
                        >
                          <div style={styles.partyLogo}>
                            {party.logo_url &&
                            (party.logo_url.startsWith("http") ||
                              party.logo_url.includes("/")) ? (
                              <img
                                src={party.logo_url}
                                alt={party.name}
                                style={styles.partyLogoImg}
                              />
                            ) : (
                              <span style={styles.partyLogoEmoji}>
                                {party.logo_url || "🎯"}
                              </span>
                            )}
                          </div>
                          <h3>{party.name}</h3>
                          <p>{party.description}</p>
                          <div style={styles.voteCount}>
                            {party.vote_count} votes
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!voteStatus.hasVoted && (
                    <button
                      onClick={handleVote}
                      disabled={!selectedParty}
                      style={styles.voteBtn}
                    >
                      Cast Vote
                    </button>
                  )}
                </div>
              )}

              {activeTab === "campaigns" && (
                <div>
                  <h2 style={styles.pageTitle}>Campaign Highlights</h2>

                  {/* NEW: Campaign Search Bar */}
                  <div style={styles.searchBar}>
                    <Search size={20} color="#6b7280" />
                    <input
                      type="text"
                      placeholder="Search campaigns by title, description, or party..."
                      value={campaignSearchQuery}
                      onChange={(e) => setCampaignSearchQuery(e.target.value)}
                      style={styles.searchBarInput}
                    />
                  </div>
                  {/* END NEW: Campaign Search Bar */}

                  <div style={styles.campaignsGrid}>
                    {/* Use filteredCampaigns instead of campaigns */}
                    {filteredCampaigns.map((campaign) => (
                      <div key={campaign.id} style={styles.campaignCard}>
                        <div style={styles.campaignImageContainer}>
                          {campaign.image_url &&
                          campaign.image_url.startsWith("data:image") ? (
                            <img
                              src={campaign.image_url}
                              alt={campaign.title}
                              style={styles.campaignImg}
                            />
                          ) : campaign.image_url &&
                            campaign.image_url.startsWith("http") ? (
                            <img
                              src={campaign.image_url}
                              alt={campaign.title}
                              style={styles.campaignImg}
                            />
                          ) : (
                            <div style={styles.campaignPlaceholder}>
                              <span style={styles.placeholderText}>📷</span>
                            </div>
                          )}
                        </div>
                        <h3>{campaign.title}</h3>
                        <p style={styles.partyTag}>{campaign.party_name}</p>
                        <p>{campaign.description}</p>
                      </div>
                    ))}
                    {filteredCampaigns.length === 0 && (
                      <p
                        style={{
                          textAlign: "center",
                          gridColumn: "1 / -1",
                          padding: "20px",
                          color: "#9ca3af",
                        }}
                      >
                        No campaigns found matching your search.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PARTY DASHBOARD */}
              {activeTab === "party" && (
                <div>
                  <h2 style={styles.pageTitle}>Party Dashboard</h2>
                  {!partyProfile ? (
                    <div style={styles.createPartySection}>
                      <h3>Create Your Party</h3>
                      <form onSubmit={handleCreateParty} style={styles.form}>
                        <input
                          type="text"
                          placeholder="Party Name"
                          value={newParty.name}
                          onChange={(e) =>
                            setNewParty({ ...newParty, name: e.target.value })
                          }
                          style={styles.input}
                          required
                        />
                        <textarea
                          placeholder="Description"
                          value={newParty.description}
                          onChange={(e) =>
                            setNewParty({
                              ...newParty,
                              description: e.target.value,
                            })
                          }
                          style={{ ...styles.input, minHeight: "100px" }}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Logo (emoji or leave for default)"
                          value={newParty.logo_url}
                          onChange={(e) =>
                            setNewParty({
                              ...newParty,
                              logo_url: e.target.value,
                            })
                          }
                          style={styles.input}
                        />
                        <button type="submit" style={styles.submitBtn}>
                          Create Party
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <div style={styles.partyProfileCard}>
                        <div style={styles.partyLogoSection}>
                          <div style={styles.partyLogoDisplay}>
                            {partyProfile.logo_url &&
                            (partyProfile.logo_url.startsWith("http") ||
                              partyProfile.logo_url.includes("/")) ? (
                              <img
                                src={partyProfile.logo_url}
                                alt="Party Logo"
                                style={styles.partyLogoDisplayImg}
                              />
                            ) : (
                              <div style={styles.partyLogoEmojiLarge}>
                                {partyProfile.logo_url || "🎯"}
                              </div>
                            )}
                          </div>
                          <label style={styles.uploadLogoButton}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePartyLogoChange}
                              style={{ display: "none" }}
                            />
                            📷 Change Logo
                          </label>
                        </div>
                        <div style={styles.partyInfoSection}>
                          <h3>{partyProfile.name}</h3>
                          <p>{partyProfile.description}</p>
                        </div>
                      </div>

                      <div style={styles.statsGrid}>
                        <div style={styles.statCard}>
                          <h4>Total Votes</h4>
                          <p style={styles.statNumber}>{voteCount}</p>
                        </div>
                        <div style={styles.statCard}>
                          <h4>Campaigns</h4>
                          <p style={styles.statNumber}>
                            {partyCampaigns.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "party-campaigns" && partyProfile && (
                <div>
                  <h2 style={styles.pageTitle}>Manage Campaigns</h2>
                  <form
                    onSubmit={handleCreateCampaign}
                    style={styles.campaignForm}
                  >
                    <h3>Create New Campaign</h3>
                    <input
                      type="text"
                      placeholder="Campaign Title"
                      value={newCampaign.title}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          title: e.target.value,
                        })
                      }
                      style={styles.input}
                      required
                    />
                    <textarea
                      placeholder="Description"
                      value={newCampaign.description}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          description: e.target.value,
                        })
                      }
                      style={{ ...styles.input, minHeight: "80px" }}
                      required
                    />
                    <div style={styles.imageUploadContainer}>
                      <label style={styles.imageLabel}>Campaign Image:</label>
                      {campaignImagePreview ? (
                        <div style={styles.imagePreviewContainer}>
                          <img
                            src={campaignImagePreview}
                            alt="Preview"
                            style={styles.imagePreviewImg}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCampaignImageFile(null);
                              setCampaignImagePreview(null);
                            }}
                            style={styles.removeImageBtn}
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div style={styles.uploadOptions}>
                          <label style={styles.uploadButton}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCampaignImageChange}
                              style={{ display: "none" }}
                            />
                            📁 Choose Image from Computer
                          </label>
                          <div style={styles.orDivider}>OR</div>
                          <input
                            type="text"
                            placeholder="Or paste image URL"
                            value={newCampaign.image_url}
                            onChange={(e) =>
                              setNewCampaign({
                                ...newCampaign,
                                image_url: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                      )}
                    </div>
                    <button type="submit" style={styles.submitBtn}>
                      Create Campaign
                    </button>
                  </form>
                  <h3 style={{ marginTop: "40px" }}>Your Campaigns</h3>
                  <div style={styles.campaignsGrid}>
                    {partyCampaigns.map((campaign) => (
                      <div key={campaign.id} style={styles.campaignCard}>
                        <div style={styles.campaignImageContainer}>
                          {campaign.image_url &&
                          campaign.image_url.startsWith("data:image") ? (
                            <img
                              src={campaign.image_url}
                              alt={campaign.title}
                              style={styles.campaignImg}
                            />
                          ) : campaign.image_url &&
                            campaign.image_url.startsWith("http") ? (
                            <img
                              src={campaign.image_url}
                              alt={campaign.title}
                              style={styles.campaignImg}
                            />
                          ) : (
                            <div style={styles.campaignPlaceholder}>
                              <span style={styles.placeholderText}>📷</span>
                            </div>
                          )}
                        </div>
                        <h3>{campaign.title}</h3>
                        <p>{campaign.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADMIN DASHBOARD */}
              {activeTab === "admin" && (
                <div>
                  <h2 style={styles.pageTitle}>Admin Overview</h2>
                  <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                      <Users size={32} color="#6366f1" />
                      <h4>Total Users</h4>
                      <p style={styles.statNumber}>{stats.totalUsers || 0}</p>
                    </div>
                    <div style={styles.statCard}>
                      <Vote size={32} color="#10b981" />
                      <h4>Total Votes</h4>
                      <p style={styles.statNumber}>{stats.totalVotes || 0}</p>
                    </div>
                    <div style={styles.statCard}>
                      <BarChart3 size={32} color="#f59e0b" />
                      <h4>Total Parties</h4>
                      <p style={styles.statNumber}>{stats.totalParties || 0}</p>
                    </div>
                    <div style={styles.statCard}>
                      <TrendingUp size={32} color="#8b5cf6" />
                      <h4>Voters</h4>
                      <p style={styles.statNumber}>{stats.totalVoters || 0}</p>
                    </div>
                  </div>
                  <div style={styles.adminActions}>
                    <button
                      onClick={() => handleExport("users")}
                      style={styles.exportBtn}
                    >
                      <Download size={18} /> Export Users
                    </button>
                    <button
                      onClick={() => handleExport("parties")}
                      style={styles.exportBtn}
                    >
                      <Download size={18} /> Export Parties
                    </button>
                    <button
                      onClick={() => handleExport("votes")}
                      style={styles.exportBtn}
                    >
                      <Download size={18} /> Export Votes
                    </button>
                    <button
                      onClick={handleResetElection}
                      style={styles.resetBtn}
                    >
                      <RefreshCw size={18} /> Reset Election
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "admin-users" && (
                <div>
                  <h2 style={styles.pageTitle}>Manage Users</h2>
                  {/* Search Bar for Admin Users (from previous request) */}
                  <div style={styles.searchBar}>
                    <Search size={20} color="#6b7280" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={styles.searchBarInput}
                    />
                  </div>
                  {/* End Search Bar */}
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>ID</th>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th}>Role</th>
                          <th style={styles.th}>Voted</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Use filteredUsers instead of users */}
                        {filteredUsers.map((u) => (
                          <tr key={u.id} style={styles.tr}>
                            <td style={styles.td}>{u.id}</td>
                            <td style={styles.td}>{u.name}</td>
                            <td style={styles.td}>{u.email}</td>
                            <td style={styles.td}>{u.role}</td>
                            <td style={styles.td}>
                              {u.has_voted ? (
                                <CheckCircle size={16} color="#10b981" />
                              ) : (
                                <XCircle size={16} color="#ef4444" />
                              )}
                            </td>
                            <td style={styles.td}>
                              {u.id !== user.id && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  style={styles.deleteBtn}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                      <p
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#9ca3af",
                        }}
                      >
                        No users found matching your search.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "admin-parties" && (
                <div>
                  <h2 style={styles.pageTitle}>Manage Parties</h2>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>ID</th>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Creator</th>
                          <th style={styles.th}>Votes</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminParties.map((p) => (
                          <tr key={p.id} style={styles.tr}>
                            <td style={styles.td}>{p.id}</td>
                            <td style={styles.td}>
                              {p.logo_url} {p.name}
                            </td>
                            <td style={styles.td}>{p.creator_name}</td>
                            <td style={styles.td}>{p.vote_count}</td>
                            <td style={styles.td}>
                              <button
                                onClick={() => handleDeleteParty(p.id)}
                                style={styles.deleteBtn}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "admin-logs" && (
                <div>
                  <h2 style={styles.pageTitle}>System Logs</h2>
                  <div style={styles.logsContainer}>
                    {logs.map((log) => (
                      <div key={log.id} style={styles.logCard}>
                        <div style={styles.logHeader}>
                          <span style={styles.logAction}>{log.action}</span>
                          <span style={styles.logTime}>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.user_name && (
                          <p style={styles.logUser}>
                            User: {log.user_name} ({log.user_email})
                          </p>
                        )}
                        {log.details && (
                          <p style={styles.logDetails}>{log.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Online Voting System © 2024 | Secure & Transparent Elections</p>
      </footer>
    </div>
  );
}

// ============ STYLES ============
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f3f4f6",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "20px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  message: {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 20px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    zIndex: 1000,
    animation: "slide-in 0.3s ease-out",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
  },
  success: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    border: "1px solid #6ee7b7",
  },
  header: {
    backgroundColor: "#6366f1",
    color: "white",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  userName: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background-color 0.2s",
  },
  main: {
    flex: 1,
    padding: "20px",
  },
  authContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 200px)",
  },
  authCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "450px",
    overflow: "hidden",
  },
  authTabs: {
    display: "flex",
    borderBottom: "2px solid #e5e7eb",
  },
  authTab: {
    flex: 1,
    padding: "15px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    color: "#6b7280",
    transition: "all 0.2s",
  },
  authTabActive: {
    color: "#6366f1",
    borderBottom: "2px solid #6366f1",
  },
  form: {
    padding: "30px",
  },
  formTitle: {
    marginBottom: "20px",
    color: "#1f2937",
    fontSize: "24px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  testAccounts: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#6b7280",
  },
  testTitle: {
    fontWeight: "600",
    marginBottom: "8px",
    color: "#374151",
  },
  dashboard: {
    display: "flex",
    gap: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
    minHeight: "calc(100vh - 200px)",
  },
  sidebar: {
    width: "250px",
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    height: "fit-content",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    textAlign: "left",
  },
  navBtnActive: {
    backgroundColor: "#ede9fe",
    color: "#6366f1",
  },
  content: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "30px",
  },
  votedCard: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#f0fdf4",
    borderRadius: "12px",
    border: "2px solid #86efac",
  },
  partiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  partyCard: {
    padding: "25px",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center",
  },
  partyCardSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#ede9fe",
    transform: "scale(1.02)",
  },
  partyLogo: {
    fontSize: "48px",
    marginBottom: "15px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  partyLogoImg: {
    width: "80px",
    height: "80px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  partyLogoEmoji: {
    fontSize: "64px",
  },
  voteCount: {
    marginTop: "15px",
    padding: "8px",
    backgroundColor: "#f3f4f6",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#6b7280",
  },
  voteBtn: {
    padding: "15px 40px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    display: "block",
    margin: "0 auto",
    transition: "background-color 0.2s",
  },
  campaignsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    marginTop: "20px", // Added space below search bar
  },
  campaignCard: {
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    backgroundColor: "white",
    overflow: "hidden",
  },
  campaignImageContainer: {
    width: "100%",
    height: "180px",
    marginBottom: "15px",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  campaignImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  campaignPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  placeholderText: {
    fontSize: "48px",
    color: "#9ca3af",
  },
  partyTag: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#ede9fe",
    color: "#6366f1",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    marginBottom: "10px",
  },
  createPartySection: {
    maxWidth: "600px",
    margin: "0 auto",
  },
  partyProfileCard: {
    display: "flex",
    gap: "30px",
    padding: "30px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    marginBottom: "30px",
    border: "1px solid #e5e7eb",
  },
  partyLogoSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
  },
  partyLogoDisplay: {
    width: "150px",
    height: "150px",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #d1d5db",
  },
  partyLogoDisplayImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  partyLogoEmojiLarge: {
    fontSize: "64px",
  },
  uploadLogoButton: {
    padding: "10px 20px",
    backgroundColor: "#6366f1",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "center",
    transition: "background-color 0.2s",
  },
  partyInfoSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    padding: "25px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  statNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    marginTop: "10px",
  },
  campaignForm: {
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    marginBottom: "30px",
  },
  adminActions: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    marginTop: "30px",
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  resetBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    marginTop: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "15px",
    textAlign: "left",
    backgroundColor: "#f9fafb",
    fontWeight: "600",
    color: "#374151",
    borderBottom: "2px solid #e5e7eb",
  },
  tr: {
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "15px",
    color: "#6b7280",
  },
  deleteBtn: {
    padding: "6px 12px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  logsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  logCard: {
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  logAction: {
    fontWeight: "600",
    color: "#1f2937",
  },
  logTime: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  logUser: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "5px",
  },
  logDetails: {
    fontSize: "13px",
    color: "#9ca3af",
  },
  footer: {
    backgroundColor: "#1f2937",
    color: "white",
    textAlign: "center",
    padding: "20px",
    marginTop: "auto",
  },
  imageUploadContainer: {
    marginBottom: "20px",
  },
  imageLabel: {
    display: "block",
    marginBottom: "12px",
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px",
  },
  uploadOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  uploadButton: {
    display: "block",
    padding: "15px",
    backgroundColor: "#6366f1",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "center",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  orDivider: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "14px",
    fontWeight: "500",
  },
  imagePreviewContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  imagePreviewImg: {
    width: "100%",
    maxHeight: "250px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "2px solid #e5e7eb",
  },
  removeImageBtn: {
    padding: "10px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    padding: "10px 15px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    marginBottom: "20px",
    backgroundColor: "#f9fafb",
  },
  searchBarInput: {
    flex: 1,
    border: "none",
    padding: "0 10px",
    outline: "none",
    backgroundColor: "transparent",
    fontSize: "14px",
  },
};

export default App;
