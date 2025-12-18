document.addEventListener("DOMContentLoaded", async () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Force a fresh fetch to avoid stale cached responses
      const response = await fetch("/activities", { cache: "no-cache", headers: { "Cache-Control": "no-cache" } });
      const activities = await response.json();

      // Clear loading message and reset select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const availabilityText = spotsLeft > 0 ? `${spotsLeft} spots left` : "Full";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${availabilityText}</p>

          <div class="participants">
            <h5>Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list
        const participantsList = activityCard.querySelector(".participants-list");
        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((participant) => {
            const li = document.createElement("li");

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            // Create initials from the email/local-part
            const localPart = participant.split("@")[0] || "";
            const initials = localPart
              .split(/[.\-_]/)
              .map((s) => s.charAt(0).toUpperCase())
              .filter(Boolean)
              .slice(0, 2)
              .join("") || "?";
            avatar.textContent = initials;

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = participant;

            li.appendChild(avatar);
            li.appendChild(emailSpan);

            // remove (delete) button to unregister participant
            const removeBtn = document.createElement("button");
            removeBtn.className = "participant-remove";
            removeBtn.title = "Remove participant";
            removeBtn.textContent = "🗑️";
            removeBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${participant} from ${name}?`)) return;
              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`, {
                  method: "DELETE",
                });
                const result = await res.json();
                if (res.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = "message info";
                  messageDiv.classList.remove("hidden");
                      // Refresh activities to reflect removal
                  await fetchActivities();
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                } else {
                  messageDiv.textContent = result.detail || "Failed to remove participant";
                  messageDiv.className = "message error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (err) {
                messageDiv.textContent = "Failed to remove participant";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
                console.error(err);
              }
            });

            li.appendChild(removeBtn);
            participantsList.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet.";
          participantsList.appendChild(li);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show the new participant and wait for it to complete
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
