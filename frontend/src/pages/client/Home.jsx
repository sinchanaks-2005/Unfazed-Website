import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">

      {/* NAVBAR */}
      <header className="home-navbar">
        <div className="home-logo">
          <span>UN</span>
          <div>
            <h2>UNFAZED</h2>
            <p>Mind • Support • Growth</p>
          </div>
        </div>

        <nav className="home-nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#support">Support</a>
        </nav>

        <div className="home-nav-actions">
          <Link
            to="/therapist/login"
            className="home-login-button"
          >
            Therapist Login
          </Link>

          <a
            href="#find-therapist"
            className="home-primary-button"
          >
            Find a Therapist
          </a>
        </div>
      </header>


      {/* HERO SECTION */}
      <section className="home-hero" id="home">

        <div className="hero-content">

          <span className="hero-label">
            YOUR WELL-BEING MATTERS
          </span>

          <h1>
            A calmer mind
            <br />
            starts with
            <span> the right support.</span>
          </h1>

          <p>
            Connect with caring therapists in a safe,
            welcoming environment designed to help you
            understand yourself, overcome challenges,
            and grow with confidence.
          </p>

          <div className="hero-buttons">

            <a
              href="#find-therapist"
              className="hero-main-button"
            >
              Find Your Therapist →
            </a>

            <a
              href="#how-it-works"
              className="hero-secondary-button"
            >
              Learn How It Works
            </a>

          </div>

          <div className="hero-trust">

            <div className="trust-item">
              <strong>100%</strong>
              <span>Private & Secure</span>
            </div>

            <div className="trust-divider"></div>

            <div className="trust-item">
              <strong>Professional</strong>
              <span>Therapist Support</span>
            </div>

            <div className="trust-divider"></div>

            <div className="trust-item">
              <strong>Flexible</strong>
              <span>Online Sessions</span>
            </div>

          </div>

        </div>


        {/* HERO VISUAL */}
        <div className="hero-visual">

          <div className="hero-circle"></div>

          <div className="hero-card hero-card-main">

            <div className="hero-icon">
              ♡
            </div>

            <h3>
              Your journey
              <br />
              starts here.
            </h3>

            <p>
              Take one step toward
              feeling better.
            </p>

          </div>

          <div className="floating-card floating-card-top">

            <span className="floating-icon">
              ✦
            </span>

            <div>
              <strong>
                A safe space
              </strong>

              <small>
                to be yourself
              </small>
            </div>

          </div>

          <div className="floating-card floating-card-bottom">

            <span className="online-dot"></span>

            <div>
              <strong>
                Caring support
              </strong>

              <small>
                when you need it
              </small>
            </div>

          </div>

        </div>

      </section>


      {/* ABOUT SECTION */}
      <section className="home-about" id="about">

        <div className="section-heading">

          <span>
            ABOUT UNFAZED
          </span>

          <h2>
            Mental well-being deserves
            <br />
            <em>time, care and understanding.</em>
          </h2>

          <p>
            Unfazed is designed to make professional
            mental-health support easier to discover
            and access. We bring clients and therapists
            together through a simple and supportive
            digital experience.
          </p>

        </div>

        <div className="about-cards">

          <div className="about-card">
            <div className="about-card-icon">
              ♡
            </div>

            <h3>
              Feel Heard
            </h3>

            <p>
              Have a space where your thoughts,
              concerns and experiences can be
              understood without judgment.
            </p>
          </div>


          <div className="about-card">
            <div className="about-card-icon">
              ✦
            </div>

            <h3>
              Find Support
            </h3>

            <p>
              Discover therapists based on their
              areas of expertise and the support
              you are looking for.
            </p>
          </div>


          <div className="about-card">
            <div className="about-card-icon">
              ◌
            </div>

            <h3>
              Grow Forward
            </h3>

            <p>
              Work towards healthier coping strategies,
              personal growth and improved emotional
              well-being.
            </p>
          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}
      <section
        className="how-it-works"
        id="how-it-works"
      >

        <div className="section-heading light-heading">

          <span>
            HOW IT WORKS
          </span>

          <h2>
            Simple steps.
            <br />
            <em>Meaningful support.</em>
          </h2>

        </div>


        <div className="steps-container">

          <div className="step-card">

            <div className="step-number">
              01
            </div>

            <h3>
              Explore
            </h3>

            <p>
              Learn about different areas of
              mental-health support and discover
              therapists who may be right for you.
            </p>

          </div>


          <div className="step-line"></div>


          <div className="step-card">

            <div className="step-number">
              02
            </div>

            <h3>
              Choose
            </h3>

            <p>
              Review therapist profiles, areas
              of specialization and available
              information before making your choice.
            </p>

          </div>


          <div className="step-line"></div>


          <div className="step-card">

            <div className="step-number">
              03
            </div>

            <h3>
              Connect
            </h3>

            <p>
              Take the next step towards your
              well-being by connecting with the
              therapist you choose.
            </p>

          </div>

        </div>

      </section>


      {/* SUPPORT SECTION */}
      <section
        className="support-section"
        id="support"
      >

        <div className="section-heading">

          <span>
            AREAS OF SUPPORT
          </span>

          <h2>
            Support for different
            <br />
            <em>parts of your journey.</em>
          </h2>

        </div>


        <div className="support-grid">

          <div className="support-item">
            <span>01</span>
            <h3>Anxiety & Stress</h3>
            <p>
              Understand stress and develop
              healthier ways to manage everyday
              challenges.
            </p>
          </div>

          <div className="support-item">
            <span>02</span>
            <h3>Personal Growth</h3>
            <p>
              Build self-awareness, confidence
              and healthier patterns in life.
            </p>
          </div>

          <div className="support-item">
            <span>03</span>
            <h3>Emotional Well-being</h3>
            <p>
              Explore your emotions and develop
              practical coping strategies.
            </p>
          </div>

          <div className="support-item">
            <span>04</span>
            <h3>Life Challenges</h3>
            <p>
              Receive support while navigating
              difficult personal situations and
              transitions.
            </p>
          </div>

        </div>

      </section>


      {/* FIND THERAPIST CTA */}
      <section
        className="home-cta"
        id="find-therapist"
      >

        <div className="cta-content">

          <span>
            TAKE THE FIRST STEP
          </span>

          <h2>
            You don't have to
            <br />
            figure everything out alone.
          </h2>

          <p>
            When you're ready, we're here to
            help you find the right support.
          </p>

          <button className="cta-button">
            Find a Therapist →
          </button>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="home-footer">

        <div className="footer-brand">

          <h2>
            UNFAZED
          </h2>

          <p>
            Mind • Support • Growth
          </p>

          <span>
            A platform designed to make
            mental-health support more accessible.
          </span>

        </div>


        <div className="footer-links">

          <div>
            <h4>
              Platform
            </h4>

            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#how-it-works">
              How It Works
            </a>
          </div>


          <div>
            <h4>
              Support
            </h4>

            <a href="#support">
              Areas of Support
            </a>

            <a href="#find-therapist">
              Find a Therapist
            </a>
          </div>


          <div>
            <h4>
              Therapists
            </h4>

            <Link to="/therapist/login">
              Therapist Login
            </Link>

            <Link to="/therapist/signup">
              Join as Therapist
            </Link>
          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © 2026 Unfazed. All rights reserved.
          </span>

          <span>
            Built for better mental well-being.
          </span>

        </div>

      </footer>

    </div>
  );
}

export default Home;