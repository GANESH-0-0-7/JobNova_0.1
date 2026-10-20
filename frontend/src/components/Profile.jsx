import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../services/AuthContext";

const Profile = ({ userType = "jobseeker" }) => {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      title: "",
      bio: "",
      avatar: null,
    },

    professional: {
      experience: "",
      currentCompany: "",
      skills: [],
      education: "",
      expectedSalary: "",
      resumeUrl: null,

      companyName: "",
      industry: "",
      companySize: "",
      website: "",
      description: "",
    },

    preferences: {
      jobTypes: [],
      preferredLocations: [],
      salaryRange: "",
      workMode: "",
      availability: "",

      hiringGoals: "",
      budgetRange: "",
      hiringUrgency: "",
      teamSize: "",
    },
  });

  useEffect(() => {
    if (!user) return;

    const fullName = user.name || "";
    const nameParts = fullName.trim().split(" ");

    setProfileData({
      personal: {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" "),
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        title:
          user.title ||
          (userType === "employer"
            ? "Employer"
            : "Job Seeker"),
        bio: user.bio || "",
        avatar: user.avatar || null,
      },

      professional:
        userType === "jobseeker"
          ? {
              experience: user.experience || "",
              currentCompany: user.currentCompany || "",
              skills: user.skills || [],
              education: user.education || "",
              expectedSalary: user.expectedSalary || "",
              resumeUrl: user.resumeUrl || null,
            }
          : {
              companyName: user.companyName || "",
              industry: user.industry || "",
              companySize: user.companySize || "",
              website: user.website || "",
              description: user.description || "",
            },

      preferences:
        userType === "jobseeker"
          ? {
              jobTypes: user.jobTypes || [],
              preferredLocations:
                user.preferredLocations || [],
              salaryRange: user.salaryRange || "",
              workMode: user.workMode || "",
              availability: user.availability || "",
            }
          : {
              hiringGoals: user.hiringGoals || "",
              budgetRange: user.budgetRange || "",
              hiringUrgency:
                user.hiringUrgency || "",
              teamSize: user.teamSize || "",
            },
    });
  }, [user, userType]);

  const handleSave = async () => {
    try {
      // TODO:
      // Replace with your backend API call
      // Example:
      // await axios.put("/api/profile", profileData);

      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      setProfileData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          avatar: e.target.result,
        },
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setProfileData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        resumeUrl: file.name,
      },
    }));
  };

  const addSkill = () => {
    const skill = prompt("Enter Skill");

    if (!skill) return;

    setProfileData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: [
          ...prev.professional.skills,
          skill,
        ],
      },
    }));
  };

  const removeSkill = (skill) => {
    setProfileData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: prev.professional.skills.filter(
          (s) => s !== skill
        ),
      },
    }));
  };
  return (
  <div className="min-h-screen bg-gray-50">

    {/* Header */}
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center py-6">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Profile
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your professional profile
            </p>
          </div>

          <div className="flex gap-3">

            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}

          </div>

        </div>

      </div>
    </div>

    {/* Content */}

    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white rounded-xl shadow overflow-hidden">

        {/* Profile Banner */}

        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8">

          <div className="flex items-center gap-5">

            <div className="relative">

              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden shadow">

                {profileData.personal.avatar ? (

                  <img
                    src={profileData.personal.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />

                ) : (

                  <span className="text-3xl font-bold text-gray-500">
                    {profileData.personal.firstName?.charAt(0)}
                    {profileData.personal.lastName?.charAt(0)}
                  </span>

                )}

              </div>

              {isEditing && (

                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700"
                >
                  +
                </button>

              )}

            </div>

            <div className="text-white">

              <h2 className="text-3xl font-bold">

                {profileData.personal.firstName}
                {" "}
                {profileData.personal.lastName}

              </h2>

              <p className="text-blue-100">
                {profileData.personal.title}
              </p>

              <p className="text-blue-200">
                {profileData.personal.location}
              </p>

            </div>

          </div>

        </div>

        {/* Tabs */}

        <div className="border-b">

          <div className="flex">

            {[
              {
                id: "personal",
                label: "Personal"
              },
              {
                id: "professional",
                label:
                  userType === "jobseeker"
                    ? "Professional"
                    : "Company"
              },
              {
                id: "preferences",
                label: "Preferences"
              }
            ].map(tab => (

              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium border-b-2 transition

                ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                {tab.label}
              </button>

            ))}

          </div>

        </div>

        {/* Body */}

        <div className="p-6">

          {activeTab === "personal" && (

            <div className="space-y-6">

              <h3 className="text-xl font-semibold">
                Personal Information
              </h3>

              <div className="grid md:grid-cols-2 gap-5">

                <div>

                  <label className="block text-sm font-medium mb-1">
                    First Name
                  </label>

                  <input
                    disabled={!isEditing}
                    value={profileData.personal.firstName}
                    onChange={(e) =>
                      setProfileData(prev => ({
                        ...prev,
                        personal: {
                          ...prev.personal,
                          firstName: e.target.value
                        }
                      }))
                    }
                    className="w-full border rounded-lg p-2"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Last Name
                  </label>

                  <input
                    disabled={!isEditing}
                    value={profileData.personal.lastName}
                    onChange={(e) =>
                      setProfileData(prev => ({
                        ...prev,
                        personal: {
                          ...prev.personal,
                          lastName: e.target.value
                        }
                      }))
                    }
                    className="w-full border rounded-lg p-2"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>

                  <input
                    disabled={!isEditing}
                    value={profileData.personal.email}
                    onChange={(e) =>
                      setProfileData(prev => ({
                        ...prev,
                        personal: {
                          ...prev.personal,
                          email: e.target.value
                        }
                      }))
                    }
                    className="w-full border rounded-lg p-2"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>

                  <input
                    disabled={!isEditing}
                    value={profileData.personal.phone}
                    onChange={(e) =>
                      setProfileData(prev => ({
                        ...prev,
                        personal: {
                          ...prev.personal,
                          phone: e.target.value
                        }
                      }))
                    }
                    className="w-full border rounded-lg p-2"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Location
                  </label>

                  <input
                    disabled={!isEditing}
                    value={profileData.personal.location}
                    onChange={(e) =>
                      setProfileData(prev => ({
                        ...prev,
                        personal: {
                          ...prev.personal,
                          location: e.target.value
                        }
                      }))
                    }
                    className="w-full border rounded-lg p-2"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Title
                  </label>

                  <input
                    disabled={!isEditing}
                    value={profileData.personal.title}
                    onChange={(e) =>
                      setProfileData(prev => ({
                        ...prev,
                        personal: {
                          ...prev.personal,
                          title: e.target.value
                        }
                      }))
                    }
                    className="w-full border rounded-lg p-2"
                  />

                </div>

              </div>

              <div>

                <label className="block text-sm font-medium mb-1">
                  Bio
                </label>

                <textarea
                  rows={5}
                  disabled={!isEditing}
                  value={profileData.personal.bio}
                  onChange={(e) =>
                    setProfileData(prev => ({
                      ...prev,
                      personal: {
                        ...prev.personal,
                        bio: e.target.value
                      }
                    }))
                  }
                  className="w-full border rounded-lg p-3"
                />

              </div>

            </div>

          )}
          {activeTab === "professional" && (
  <div className="space-y-6">

    <h3 className="text-xl font-semibold">
      {userType === "jobseeker"
        ? "Professional Information"
        : "Company Information"}
    </h3>

    {userType === "jobseeker" ? (

      <>
        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <label className="block text-sm font-medium mb-1">
              Experience
            </label>

            <select
              disabled={!isEditing}
              value={profileData.professional.experience}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  professional: {
                    ...prev.professional,
                    experience: e.target.value,
                  },
                }))
              }
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select</option>
              <option value="0-1 years">0-1 years</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3-5 years">3-5 years</option>
              <option value="5-10 years">5-10 years</option>
              <option value="10+ years">10+ years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Current Company
            </label>

            <input
              disabled={!isEditing}
              value={profileData.professional.currentCompany}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  professional: {
                    ...prev.professional,
                    currentCompany: e.target.value,
                  },
                }))
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Education
            </label>

            <input
              disabled={!isEditing}
              value={profileData.professional.education}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  professional: {
                    ...prev.professional,
                    education: e.target.value,
                  },
                }))
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Expected Salary
            </label>

            <input
              disabled={!isEditing}
              value={profileData.professional.expectedSalary}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  professional: {
                    ...prev.professional,
                    expectedSalary: e.target.value,
                  },
                }))
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

        </div>

        <div>

          <div className="flex justify-between items-center mb-2">

            <label className="text-sm font-medium">
              Skills
            </label>

            {isEditing && (
              <button
                onClick={addSkill}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg"
              >
                Add Skill
              </button>
            )}

          </div>

          <div className="flex flex-wrap gap-2">

            {profileData.professional.skills.map((skill, index) => (

              <span
                key={index}
                className="flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-3 py-1"
              >
                {skill}

                {isEditing && (
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-red-600"
                  >
                    ×
                  </button>
                )}

              </span>

            ))}

          </div>

        </div>

        <div>

          <label className="block text-sm font-medium mb-2">
            Resume
          </label>

          <div className="flex items-center gap-4">

            <span>
              {profileData.professional.resumeUrl ||
                "No resume uploaded"}
            </span>

            {isEditing && (
              <button
                onClick={() => resumeInputRef.current.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Upload Resume
              </button>
            )}

          </div>

        </div>

      </>

    ) : (

      <>
        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <label className="block text-sm font-medium mb-1">
              Company Name
            </label>

            <input
              disabled={!isEditing}
              value={profileData.professional.companyName}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  professional: {
                    ...prev.professional,
                    companyName: e.target.value,
                  },
                }))
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Industry
            </label>

            <input
              disabled={!isEditing}
              value={profileData.professional.industry}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  professional: {
                    ...prev.professional,
                    industry: e.target.value,
                  },
                }))
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Company Size
            </label>

            <input
              disabled={!isEditing}
              value={profileData.professional.companySize}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  professional: {
                    ...prev.professional,
                    companySize: e.target.value,
                  },
                }))
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Website
            </label>

            <input
              disabled={!isEditing}
              value={profileData.professional.website}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  professional: {
                    ...prev.professional,
                    website: e.target.value,
                  },
                }))
              }
              className="w-full border rounded-lg p-2"
            />
          </div>

        </div>

        <div>

          <label className="block text-sm font-medium mb-1">
            Company Description
          </label>

          <textarea
            rows={5}
            disabled={!isEditing}
            value={profileData.professional.description}
            onChange={(e) =>
              setProfileData((prev) => ({
                ...prev,
                professional: {
                  ...prev.professional,
                  description: e.target.value,
                },
              }))
            }
            className="w-full border rounded-lg p-3"
          />

        </div>

      </>

    )}

  </div>
)}
          {activeTab === "preferences" && (
            <div className="space-y-6">

              <h3 className="text-xl font-semibold">
                {userType === "jobseeker"
                  ? "Job Preferences"
                  : "Hiring Preferences"}
              </h3>

              {userType === "jobseeker" ? (
                <>

                  <div className="grid md:grid-cols-2 gap-5">

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Salary Range
                      </label>

                      <input
                        disabled={!isEditing}
                        value={profileData.preferences.salaryRange}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              salaryRange: e.target.value,
                            },
                          }))
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Work Mode
                      </label>

                      <select
                        disabled={!isEditing}
                        value={profileData.preferences.workMode}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              workMode: e.target.value,
                            },
                          }))
                        }
                        className="w-full border rounded-lg p-2"
                      >
                        <option value="">Select</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Availability
                      </label>

                      <input
                        disabled={!isEditing}
                        value={profileData.preferences.availability}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              availability: e.target.value,
                            },
                          }))
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                  </div>

                </>
              ) : (
                <>

                  <div className="grid md:grid-cols-2 gap-5">

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Hiring Goals
                      </label>

                      <input
                        disabled={!isEditing}
                        value={profileData.preferences.hiringGoals}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              hiringGoals: e.target.value,
                            },
                          }))
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Budget Range
                      </label>

                      <input
                        disabled={!isEditing}
                        value={profileData.preferences.budgetRange}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              budgetRange: e.target.value,
                            },
                          }))
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Hiring Urgency
                      </label>

                      <select
                        disabled={!isEditing}
                        value={profileData.preferences.hiringUrgency}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              hiringUrgency: e.target.value,
                            },
                          }))
                        }
                        className="w-full border rounded-lg p-2"
                      >
                        <option value="">Select</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Team Size
                      </label>

                      <input
                        disabled={!isEditing}
                        value={profileData.preferences.teamSize}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              teamSize: e.target.value,
                            },
                          }))
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                  </div>

                </>
              )}

            </div>
          )}

        </div>
      </div>
    </div>

    {/* Hidden Inputs */}

    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="hidden"
    />

    {userType === "jobseeker" && (
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleResumeUpload}
        className="hidden"
      />
    )}

  </div>
);

};

export default Profile;