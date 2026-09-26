import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="unfazed-home">
      {/* ================= NAVBAR ================= */}
      <nav className="home-navbar">
        <Link to="/" className="home-logo">
          <span className="logo-mark">U</span>
          <span>UNFAZED</span>
        </Link>

        <div className="home-nav-links">
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#services">Services</a>
          <a href="#therapists">Therapists</a>
        </div>

        <Link to="/therapist/login" className="nav-login">
          Therapist Login
        </Link>
      </nav>

      {/* ================= HERO ================= */}
      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span>●</span>
            A calmer way forward
          </div>

          <h1>
            Your mental health
            <br />
            <span>deserves space.</span>
          </h1>

          <p>
            Connect with trusted therapists, find the right support,
            and take your next step toward feeling better.
          </p>

          <div className="hero-buttons">
            <Link to="/therapists" className="primary-btn">
              Find a Therapist →
            </Link>

            <a href="#how-it-works" className="secondary-btn">
              How it works
            </a>
          </div>

          <div className="hero-trust">
            <div className="trust-avatars">
              <span>✓</span>
              <span>✓</span>
              <span>✓</span>
            </div>

            <div>
              <strong>Private. Secure. Personal.</strong>
              <small>Your journey stays yours.</small>
            </div>
          </div>
        </div>

        {/* Hero visual */}
        <div className="hero-visual">
          <div className="hero-circle"></div>

          <div className="hero-card main-card">
            <div className="card-icon">♡</div>

            <span>Take a breath.</span>

            <strong>
              You don't have to do it alone.
            </strong>
          </div>

          <div className="floating-card top-card">
            <span>✦</span>

            <div>
              <strong>Find your match</strong>
              <small>Trusted therapists</small>
            </div>
          </div>

          <div className="floating-card bottom-card">
            <span>✓</span>

            <div>
              <strong>Safe & confidential</strong>
              <small>Your privacy matters</small>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTRO ================= */}
      <section className="home-intro" id="about">
        <div>
          <span className="section-label">
            WHY UNFAZED
          </span>

          <h2>
            Support that fits
            <br />
            <em>your life.</em>
          </h2>
        </div>

        <p>
          Finding support should feel simple. UNFAZED brings
          therapy, trusted professionals, scheduling and care
          management together in one calm, private space.
        </p>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="services-section" id="services">
        <div className="section-heading">
          <span className="section-label">
            WHAT WE OFFER
          </span>

          <h2>
            A better way to care for your mind.
          </h2>
        </div>

        <div className="service-grid">
          <div className="service-card">
            <div className="service-number">01</div>

            <div className="service-icon">◉</div>

            <h3>
              Find the right therapist
            </h3>

            <p>
              Explore therapist profiles, specialties and
              languages to find someone who feels right for you.
            </p>

            <Link to="/therapists">
              Explore therapists →
            </Link>
          </div>

          <div className="service-card featured-service">
            <div className="service-number">02</div>

            <div className="service-icon">◷</div>

            <h3>
              Simple scheduling
            </h3>

            <p>
              View available times and choose a session that
              works naturally with your schedule.
            </p>

            <a href="#how-it-works">
              Learn more →
            </a>
          </div>

          <div className="service-card">
            <div className="service-number">03</div>

            <div className="service-icon">♡</div>

            <h3>
              A private space
            </h3>

            <p>
              Your conversations and care journey belong to you,
              with privacy at the center of the experience.
            </p>

            <a href="#about">
              Our approach →
            </a>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section
        className="how-section"
        id="how-it-works"
      >
        <div className="how-heading">
          <span className="section-label">
            HOW IT WORKS
          </span>

          <h2>
            Three steps.
            <br />
            One important decision.
          </h2>
        </div>

        <div className="steps">
          <div className="step">
            <span>01</span>

            <div>
              <h3>Explore</h3>

              <p>
                Browse therapists and discover the kind of
                support you need.
              </p>
            </div>
          </div>

          <div className="step">
            <span>02</span>

            <div>
              <h3>Connect</h3>

              <p>
                Choose a therapist and find a session time
                that works for you.
              </p>
            </div>
          </div>

          <div className="step">
            <span>03</span>

            <div>
              <h3>Begin</h3>

              <p>
                Take your first step toward a healthier,
                more balanced you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= THERAPIST CTA ================= */}
      <section
        className="therapist-section"
        id="therapists"
      >
        <div className="therapist-content">
          <span className="section-label">
            YOUR NEXT STEP
          </span>

          <h2>
            You don't need
            <br />
            to have it all figured out.
          </h2>

          <p>
            Start with one conversation. Find a therapist
            who understands what you're going through.
          </p>

          <Link
            to="/therapists"
            className="light-btn"
          >
            Find your therapist →
          </Link>
        </div>

        <div className="therapist-decoration">
          <div className="leaf leaf-one"></div>
          <div className="leaf leaf-two"></div>
          <div className="leaf leaf-three"></div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        <div className="footer-brand">
          <Link to="/" className="home-logo">
            <span className="logo-mark">U</span>
            <span>UNFAZED</span>
          </Link>

          <p>
            A calmer way to find the support you need.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <strong>Explore</strong>

            <a href="#about">About</a>

            <a href="#services">Services</a>

            <a href="#how-it-works">
              How It Works
            </a>
          </div>

          <div>
            <strong>For Therapists</strong>

            <Link to="/therapist/login">
              Login
            </Link>

            <Link to="/therapist/signup">
              Join UNFAZED
            </Link>
          </div>

          <div>
            <strong>Support</strong>

            <a href="#about">Privacy</a>

            <a href="#about">Contact</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 UNFAZED</span>

          <span>
            Made for better mental wellbeing.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Home;