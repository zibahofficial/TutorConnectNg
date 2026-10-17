#!/usr/bin/env python3
"""
Builds: TutorConnect-Nigeria-Edumentry-AI-Hackathon-1.0.pptx
Every factual claim in the deck is sourced from the TutorConnectNg repository.
"""
import os
import sys

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from deck_lib import *  # noqa: F401,F403
from deck_lib import (NAVY, NAVY_DK, NAVY_800, BLUE, BLUE_LT, EMERALD, EMERALD_DK,
                      EMERALD_LT, AMBER, AMBER_LT, ROSE, ROSE_LT, SLATE_900,
                      SLATE_700, SLATE_600, SLATE_500, SLATE_400, SLATE_300,
                      SLATE_200, SLATE_100, SLATE_50, WHITE, FONT, FONT_SB,
                      SW, SH, M, CW, new_slide, header, footer, rect, grad_rect,
                      grad_overlay, line, tb, para, run, text_at, bullet_list,
                      chip, arrow, chevron, numbered_node, notes, card,
                      icon_badge, text_h, est_lines)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "public", "images")
OUT = os.path.join(ROOT, "presentation",
                   "TutorConnect-Nigeria-Edumentry-AI-Hackathon-1.0.pptx")

TOTAL = 16


# --------------------------------------------------------------- helpers ----

def set_alpha(shape, pct):
    """Apply transparency (0-100 = fully transparent -> opaque) to a solid fill."""
    spPr = shape._element.spPr
    sf = spPr.find(qn('a:solidFill'))
    if sf is None:
        return
    clr = sf.find(qn('a:srgbClr'))
    if clr is None:
        return
    a = clr.makeelement(qn('a:alpha'), {'val': str(int((100 - pct) * 1000))})
    clr.append(a)


def picture_cover(slide, name, x, y, w, h):
    """Insert an image cropped to fill the given box (object-fit: cover)."""
    path = os.path.join(IMG, name)
    pic = slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))
    iw, ih = pic.image.size
    box_r, img_r = w / h, iw / ih
    if img_r > box_r:                       # image too wide -> crop sides
        keep = box_r / img_r
        pic.crop_left = pic.crop_right = (1 - keep) / 2
    else:                                   # image too tall -> crop top/bottom
        keep = img_r / box_r
        pic.crop_top = pic.crop_bottom = (1 - keep) / 2
    return pic


def mono(slide, x, y, w, h, lines, size=9.5, fill=SLATE_900, fg=SLATE_200,
         title=None):
    """A small dark 'code' block with monospaced-ish lines."""
    sh = rect(slide, x, y, w, h, fill=fill, radius=0.05)
    tf = sh.text_frame
    tf.margin_left = Inches(0.16)
    tf.margin_right = Inches(0.12)
    tf.margin_top = Inches(0.12)
    tf.margin_bottom = Inches(0.08)
    first = True
    if title:
        p = tf.paragraphs[0]
        p.line_spacing = 1.1
        run(p, title, size=size + 0.5, color=EMERALD, bold=True)
        first = False
    for ln in lines:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.line_spacing = 1.22
        p.space_before = Pt(1)
        if isinstance(ln, tuple):
            run(p, ln[0], size=size, color=AMBER, bold=True)
            run(p, ln[1], size=size, color=fg)
        else:
            run(p, ln, size=size, color=fg)
    return sh


def kv_row(slide, x, y, w, h, k, v, accent=BLUE, ksize=11, vsize=10.5,
           kcolor=SLATE_900, vcolor=SLATE_600, fill=WHITE, border=SLATE_200):
    card(slide, x, y, w, h, fill=fill, border=border, radius=0.10)
    rect(slide, x, y + 0.10, 0.045, h - 0.20, fill=accent, radius=0.5)
    text_at(slide, x + 0.22, y + 0.10, w - 0.36, 0.26, k, size=ksize,
            color=kcolor, bold=True)
    text_at(slide, x + 0.22, y + 0.10 + 0.26, w - 0.36, h - 0.42, v,
            size=vsize, color=vcolor, line=1.16)


def section_label(slide, x, y, w, text, color=NAVY, size=10.5):
    rect(slide, x, y + 0.035, 0.045, 0.16, fill=color)
    text_at(slide, x + 0.14, y, w - 0.14, 0.24, text.upper(), size=size,
            color=color, bold=True, caps=True, spacing=1.0)


def note_strip(slide, x, y, w, h, text, fill=AMBER_LT, border=AMBER, fg=SLATE_700,
               lead=None, lead_color=SLATE_900, size=11.5):
    card(slide, x, y, w, h, fill=fill, border=border, radius=0.06)
    box, tf = tb(slide, x + 0.28, y + 0.16, w - 0.56, h - 0.32,
                 anchor=MSO_ANCHOR.MIDDLE)
    p = tf.paragraphs[0]
    p.line_spacing = 1.2
    if lead:
        run(p, lead + "  ", size=size, color=lead_color, bold=True)
    run(p, text, size=size, color=fg)
    return box


# ============================================================== SLIDE 1 ======
def slide_title(prs):
    s = new_slide(prs, bg=NAVY_DK)
    picture_cover(s, "hero-student.jpg", 0, 0, SW, SH)
    ov = rect(s, -0.05, -0.05, SW + 0.1, SH + 0.1, fill=NAVY_DK,
              shape_type=MSO_SHAPE.RECTANGLE)
    set_alpha(ov, 12)
    ov2 = rect(s, -0.05, -0.05, SW + 0.1, SH + 0.1, fill=NAVY,
               shape_type=MSO_SHAPE.RECTANGLE)
    set_alpha(ov2, 28)
    side = grad_rect(s, -0.05, -0.05, 8.4, SH + 0.1, c1=NAVY_DK, c2=NAVY,
                     angle=0, shape_type=MSO_SHAPE.RECTANGLE)
    set_alpha(side, 18)

    # accent bar top
    rect(s, 0, 0, SW, 0.09, fill=BLUE)
    rect(s, 0, 0, SW * 0.42, 0.09, fill=EMERALD)

    chip(s, 0.85, 0.78, 3.45, 0.36, "EDUMENTRY AI HACKATHON 1.0",
         fill=RGBColor(0x1B, 0x2E, 0x63), fg=RGBColor(0xBF, 0xDB, 0xFE),
         size=10, align=PP_ALIGN.LEFT)
    text_at(s, 0.85, 1.42, 11.0, 0.95, "TUTORCONNECT NIGERIA", size=54,
            color=WHITE, bold=True, font=FONT_SB, line=1.0)
    rect(s, 0.85, 2.52, 1.55, 0.055, fill=EMERALD)
    text_at(s, 0.85, 2.78, 9.0, 0.45, "A Tutor and Student Matching Platform",
            size=22, color=RGBColor(0xBF, 0xDB, 0xFE), bold=False, font=FONT_SB)
    text_at(s, 0.85, 3.36, 7.3, 1.05,
            "A full-stack EdTech marketplace that connects Nigerian students and "
            "parents with admin-verified tutors — with a rules-based Smart Tutor "
            "Match engine, a managed booking lifecycle, private messaging and "
            "verified reviews.",
            size=12.5, color=RGBColor(0xCB, 0xD5, 0xE1), line=1.34)

    # team band
    band = rect(s, 0, 4.92, SW, 1.72, fill=NAVY_DK, shape_type=MSO_SHAPE.RECTANGLE)
    set_alpha(band, 24)
    line(s, 0, 4.92, SW, 4.92, color=RGBColor(0x3B, 0x52, 0x8F), width=1)
    text_at(s, 0.85, 5.08, 6.0, 0.26, "THE TEAM", size=10, color=EMERALD,
            bold=True, caps=True, spacing=1.4)

    team = [
        ("Hephzibah Uchechukwu", "Team Leader · Frontend, UI, Smart Tutor Match, Revenue Model"),
        ("Chioma Helen Ezeufonna", "Backend · API Routes, Server-Side Logic, Auth & Roles"),
        ("Uzochukwu Mary Cynthia Enyemakachukwu", "Database · Schema, Structure, Data Relationships"),
        ("Bodman Ebuka Precious", "Deployment · System Inspection, Testing & QA, Ops Checks"),
    ]
    x0, cw, gap = 0.85, 2.85, 0.14
    for i, (nm, role) in enumerate(team):
        cx = x0 + i * (cw + gap)
        c = rect(s, cx, 5.42, cw, 0.96, fill=RGBColor(0x14, 0x26, 0x50),
                 line=RGBColor(0x2E, 0x44, 0x80), lw=0.75, radius=0.10)
        set_alpha(c, 30)
        rect(s, cx, 5.42, 0.05, 0.96, fill=[BLUE, EMERALD, AMBER, ROSE][i])
        text_at(s, cx + 0.20, 5.54, cw - 0.34, 0.42, nm, size=10.5, color=WHITE,
                bold=True, line=1.1)
        text_at(s, cx + 0.20, 5.98, cw - 0.34, 0.36, role, size=8.5,
                color=RGBColor(0xA9, 0xBE, 0xE8), line=1.12)

    text_at(s, 0.85, 6.60, 7.2, 0.26,
            "Live:  tutor-connect-ng.vercel.app        Repository:  github.com/zibahofficial/TutorConnectNg",
            size=9.5, color=RGBColor(0x93, 0xA9, 0xD4))
    text_at(s, 8.0, 6.60, 4.45, 0.26, "MIT License  ·  Built with Next.js 16 + Neon Postgres",
            size=9.5, color=RGBColor(0x93, 0xA9, 0xD4), align=PP_ALIGN.RIGHT)

    notes(s, "Hephzibah Uchechukwu (Team Leader) opens.\n\n"
             "Good morning judges. We are TutorConnect Nigeria, a full-stack "
             "tutoring marketplace we built and deployed during this hackathon. "
             "In the next fifteen minutes the four of us will show you what we "
             "built, how it works under the hood, and what we honestly have not "
             "finished yet.\n\n"
             "Live site: tutor-connect-ng.vercel.app   |   Repo: "
             "github.com/zibahofficial/TutorConnectNg")
    return s


# ============================================================== SLIDE 2 ======
def slide_overview(prs):
    s = new_slide(prs, bg=SLATE_50)
    y = header(s, "What we built", "Project Overview",
               sub="A working marketplace, not a prototype: a live PostgreSQL database, "
                   "role-based dashboards, and a full booking lifecycle.")

    text_at(s, M, y, CW, 0.30,
            "TutorConnect Nigeria is a web platform that lets students and parents "
            "find, compare and book verified tutors across Nigeria — in person or "
            "online — and gives tutors the tools to manage their sessions.",
            size=12.5, color=SLATE_600, line=1.3)

    ytop = y + 0.46
    roles = [
        ("Student", "⌘", BLUE, BLUE_LT,
         "Search the tutor directory, save favourites, request sessions, track "
         "status, join online lessons, and review a completed session."),
        ("Parent", "◉", EMERALD, EMERALD_LT,
         "Register with a learner's details and budget, manage that learner profile, "
         "request sessions, and follow bookings and reviews from one dashboard."),
        ("Tutor", "✦", AMBER, AMBER_LT,
         "Publish a profile, upload credentials for verification, set weekly "
         "availability, accept or decline session requests, and keep history."),
        ("Administrator", "◆", ROSE, ROSE_LT,
         "Review credential applications, approve or suspend accounts, monitor "
         "booking metrics, and see gross platform revenue."),
    ]
    cw, gap = 2.90, 0.19
    for i, (nm, glyph, fg, bg, desc) in enumerate(roles):
        x = M + i * (cw + gap)
        card(s, x, ytop, cw, 2.18, fill=WHITE, border=SLATE_200, radius=0.07,
             accent=fg)
        icon_badge(s, x + 0.24, ytop + 0.28, 0.52, glyph, bg=bg, fg=fg, fsize=16)
        text_at(s, x + 0.88, ytop + 0.38, cw - 1.1, 0.32, nm, size=15,
                color=SLATE_900, bold=True, font=FONT_SB)
        text_at(s, x + 0.24, ytop + 0.96, cw - 0.48, 1.05, desc, size=10.5,
                color=SLATE_600, line=1.26)

    yf = ytop + 2.44
    section_label(s, M, yf, 6.0, "How the parts work together")
    steps = ["Register & sign in", "Role dashboard", "Discover tutors",
             "Request a booking", "Session, review & chat"]
    sw_, sgap = 2.50, -0.06
    for i, st in enumerate(steps):
        x = M + i * (sw_ + sgap)
        chevron(s, x, yf + 0.36, sw_, 0.72, st,
                fill=[NAVY_800, NAVY, BLUE, RGBColor(0x3B, 0x82, 0xF6), EMERALD_DK][i],
                size=10.5)

    note_strip(s, M, yf + 1.28, CW, 0.78,
               "every tutor listing, booking, review and message is read live from "
               "PostgreSQL. When the database is not configured the screens show an "
               "explicit empty state — the app never invents tutors, bookings or ratings.",
               lead="Truth in the data:", fill=BLUE_LT, border=RGBColor(0xBF, 0xDB, 0xFE),
               lead_color=NAVY)

    footer(s, 2, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader).\n\n"
             "TutorConnect Nigeria is a marketplace for Nigerian tutoring. Four "
             "roles: student, parent, tutor and administrator. The same account "
             "system drives all four dashboards, and every record comes from a real "
             "PostgreSQL database — we deliberately show empty states rather than "
             "fake data, so what you see in the demo is what the system really holds.")
    return s


# ============================================================== SLIDE 3 ======
def slide_problem(prs):
    s = new_slide(prs, bg=WHITE)
    y = header(s, "The problem", "The challenge: finding and booking a tutor",
               sub="The problems below are the frictions our features were built to remove — "
                   "each one is mapped to something that actually exists in the codebase.")

    probs = [
        ("01", "Finding a tutor for a specific subject",
         "Word of mouth can miss the exact subject or syllabus; there is no shared searchable tutor directory.",
         "Subject filter + Smart Tutor Match across 33 subject options"),
        ("02", "Comparing tutors on evidence, not claims",
         "Without a common profile, families struggle to compare credentials, experience, ratings and reviews.",
         "Admin review, ID + degree uploads, verified badge and ratings"),
        ("03", "Matching availability and fee to a real budget",
         "Rates and weekly availability are often discovered only after a time-consuming phone call.",
         "₦2k–₦25k budget, weekday/weekend, curriculum and location filters"),
        ("04", "Coordinating lessons and bookings",
         "Agreeing date, time, mode and fee over chat makes a request easy to lose or leave unconfirmed.",
         "Booking request → tutor decision → managed status lifecycle"),
        ("05", "Getting feedback and a paper trail",
         "After class, learners need a structured way to rate a tutor and leave a record for later comparison.",
         "One review per completed booking; rating shown on the tutor profile"),
    ]
    colw = 5.90
    positions = [(M, y + 0.42), (M, y + 1.62), (M, y + 2.82),
                 (M + colw + 0.32, y + 0.42), (M + colw + 0.32, y + 1.62)]
    for (num, ttl, body, fix), (x, yy) in zip(probs, positions):
        h = 1.16
        card(s, x, yy, colw, h, fill=SLATE_50, border=SLATE_200, radius=0.06)
        rect(s, x, yy, 0.05, h, fill=BLUE)
        text_at(s, x + 0.24, yy + 0.14, 0.5, 0.28, num, size=13, color=BLUE,
                bold=True, font=FONT_SB)
        text_at(s, x + 0.74, yy + 0.13, colw - 1.0, 0.28, ttl, size=12,
                color=SLATE_900, bold=True, font=FONT_SB)
        text_at(s, x + 0.74, yy + 0.42, colw - 1.0, 0.35, body, size=9.2,
                color=SLATE_600, line=1.15)
        text_at(s, x + 0.74, yy + 0.80, colw - 1.0, 0.33,
                "In our build:  " + fix, size=8.8, color=EMERALD_DK, bold=True,
                line=1.12)

    x2 = M + colw + 0.32
    yy = y + 2.82
    card(s, x2, yy, colw, 1.16, fill=AMBER_LT, border=AMBER, radius=0.06)
    rect(s, x2, yy, 0.05, 1.16, fill=AMBER)
    text_at(s, x2 + 0.24, yy + 0.14, colw - 0.5, 0.3,
            "What we have NOT measured", size=12.5, color=SLATE_900, bold=True,
            font=FONT_SB)
    text_at(s, x2 + 0.24, yy + 0.44, colw - 0.5, 0.58,
            "We ran no user survey, no market-sizing study and no usability test. "
            "These problems are inferred from the friction our own features are "
            "designed to remove — they are not quantified claims.",
            size=10, color=SLATE_700, line=1.2)

    note_strip(s, M, y + 4.10, CW, 0.62,
               "every problem above is addressed by a screen that ships in the repository — "
               "no concept-only features are presented as working.",
               lead="Evidence:", fill=EMERALD_LT, border=EMERALD,
               lead_color=EMERALD_DK)

    footer(s, 3, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader).\n\n"
             "Five concrete frictions. Notice the green line on each card — that is "
             "the part of our code that answers it. And the amber box on the right is "
             "deliberate: we have not run a survey, so we are not going to invent "
             "statistics about how many students struggle to find tutors.")
    return s


# ============================================================== SLIDE 4 ======
def slide_solution(prs):
    s = new_slide(prs, bg=WHITE)
    y = header(s, "Our solution", "One platform, four roles, one source of truth",
               sub="TutorConnect Nigeria turns the five problems into a single flow: "
                   "discover, verify, book, teach, review.")

    lw = 6.55
    section_label(s, M, y + 0.36, lw, "How each problem is answered")
    rows = [
        ("Searchable supply", "A filterable directory of admin-approved tutors plus a "
         "preference-driven Smart Tutor Match.", BLUE),
        ("Trust signals", "Credential upload, admin review, verified badge, ratings and "
         "reviews attached to the tutor profile.", EMERALD),
        ("Price & schedule clarity", "Hourly rate, budget slider, weekly availability "
         "slots and a live ₦ estimate at booking time.", AMBER),
        ("Managed bookings", "pending → accepted / rejected → completed / cancelled, with "
         "ownership checks on every change.", ROSE),
        ("Private channel", "Authenticated 1-to-1 messaging between a signed-in user and "
         "an eligible different-role contact.", NAVY),
    ]
    cy = y + 0.70
    for k, v, c in rows:
        h = 0.70
        card(s, M, cy, lw, h, fill=SLATE_50, border=SLATE_200, radius=0.07)
        icon_badge(s, M + 0.20, cy + 0.11, 0.46, "✓", bg=WHITE, fg=c, fsize=13)
        text_at(s, M + 0.84, cy + 0.10, lw - 1.08, 0.24, k, size=11.5,
                color=SLATE_900, bold=True, font=FONT_SB)
        text_at(s, M + 0.84, cy + 0.35, lw - 1.08, 0.30, v, size=9.5,
                color=SLATE_600, line=1.15)
        cy += h + 0.05

    # hub and spoke
    rx, rw = M + lw + 0.36, CW - lw - 0.36
    section_label(s, rx, y + 0.36, rw, "Who uses it")
    cx_mid = rx + rw / 2
    hub_y = y + 2.05
    hub_d = 1.50
    hub_top = hub_y + 0.17
    nodes = [
        ("Student", "book · review", BLUE, rx, y + 0.72, 2.05),
        ("Parent", "learner · bookings", EMERALD, rx + rw - 2.05, y + 0.72, 2.05),
        ("Tutor", "teach · manage", AMBER, rx, y + 3.90, 2.05),
        ("Administrator", "verify · govern", ROSE, rx + rw - 2.05, y + 3.90, 2.05),
    ]
    # Draw connectors first and terminate them at the hub and card edges; the
    # hub sits on top so no connector crosses its text.
    for nm, sub, c, nx, ny, nw in nodes:
        top = ny < hub_y
        y1 = hub_top if top else hub_top + hub_d
        y2 = ny + 1.04 if top else ny
        line(s, cx_mid, y1, nx + nw / 2, y2, color=SLATE_300, width=1.25)

    hub = rect(s, cx_mid - hub_d / 2, hub_y + 0.17, hub_d, hub_d, fill=NAVY, radius=0.5,
               shape_type=MSO_SHAPE.OVAL)
    tf = hub.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.margin_left = tf.margin_right = Inches(0.08)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run(p, "TutorConnect", size=12, color=WHITE, bold=True, font=FONT_SB)
    para(tf, "NIGERIA", size=12, color=EMERALD, bold=True, align=PP_ALIGN.CENTER)
    para(tf, "one platform", size=8, color=SLATE_300, align=PP_ALIGN.CENTER)

    for nm, sub, c, nx, ny, nw in nodes:
        card(s, nx, ny, nw, 1.04, fill=WHITE, border=c, radius=0.09)
        rect(s, nx, ny, nw, 0.05, fill=c)
        text_at(s, nx + 0.16, ny + 0.26, nw - 0.32, 0.28, nm, size=12,
                color=SLATE_900, bold=True, font=FONT_SB, align=PP_ALIGN.CENTER)
        text_at(s, nx + 0.16, ny + 0.58, nw - 0.32, 0.26, sub, size=9.5,
                color=c, bold=True, align=PP_ALIGN.CENTER)

    note_strip(s, M, cy + 0.12, lw, 0.58,
               "roles are stored in the users.role enum and checked by protected API "
               "actions. Dashboard routes are still client-guarded; server middleware "
               "is a stated production hardening task.",
               lead="Access model:", fill=BLUE_LT, border=RGBColor(0xBF, 0xDB, 0xFE),
               lead_color=NAVY, fg=SLATE_600)

    footer(s, 4, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader).\n\n"
             "Every problem from the previous slide now maps to a shipped feature. "
             "Four roles, one platform — and the role is not a cosmetic label: it is "
             "a database enum that the API re-checks on every privileged action.")
    return s


# ============================================================== SLIDE 5 ======
def slide_journey(prs):
    s = new_slide(prs, bg=SLATE_50)
    y = header(s, "User journey", "How the website works, end to end",
               sub="Seven steps, all of them real screens and real API calls in the repository.")

    steps = [
        ("Register or sign in", "/signup  ·  /login",
         "Role-aware signup (student, parent, tutor) validated server-side: Gmail "
         "address, 8+ character password with upper, lower, digit and symbol. "
         "bcrypt hash + JWT issued on success.", BLUE),
        ("Land on the right dashboard", "/dashboard/student | parent | tutor | admin",
         "The JWT payload carries the role; each dashboard reads it and redirects "
         "if the role does not match. Tutors get a 3-step readiness checklist.",
         EMERALD),
        ("Discover tutors", "/tutors  ·  /smart-match",
         "Filter the directory by subject, state, ₦ budget, availability and "
         "curriculum — or state your preferences and let Smart Tutor Match rank "
         "the results for you.", AMBER),
        ("Open the tutor profile", "/tutors/[id]",
         "Verified badge, headline, bio, subjects, curriculum, rating, reviews and "
         "an interactive weekly availability calendar. Only admin-verified tutors "
         "are reachable here.", ROSE),
        ("Request a booking", "BookingModal → POST /api/bookings",
         "Grade level, subject, date, time slot, online or in-person mode, notes "
         "and a live ₦ estimate. The row is created with status = pending.",
         NAVY),
        ("Tutor decides, session happens", "PATCH /api/bookings",
         "The tutor accepts (pasting a Google Meet / Zoom link) or declines. "
         "Students can edit or cancel while the request is still pending; the "
         "tutor marks it completed afterwards.", BLUE),
        ("Review and keep in touch", "/api/reviews  ·  /api/messages",
         "Students and parents can leave one 1–5 star review after a completed booking. "
         "Authenticated users can start private 1-to-1 chats with eligible contacts.",
         EMERALD),
    ]
    tw, tgap = 2.90, 0.19
    stride = tw + tgap
    positions = [(M + i * stride, y + 0.36) for i in range(4)]
    # Snake back across the second row: step 5 is directly below step 4.
    positions += [(M + i * stride, y + 2.34) for i in (3, 2, 1)]
    for i, (ttl, route, body, c) in enumerate(steps):
        x, yy = positions[i]
        h = 1.78
        card(s, x, yy, tw, h, fill=WHITE, border=SLATE_200, radius=0.07)
        numbered_node(s, x + 0.18, yy + 0.15, 0.40, i + 1, fill=c, size=11.5)
        text_at(s, x + 0.70, yy + 0.18, tw - 0.88, 0.37, ttl, size=11.5,
                color=SLATE_900, bold=True, font=FONT_SB, line=1.08)
        text_at(s, x + 0.20, yy + 0.65, tw - 0.40, 0.27, route, size=8,
                color=c, bold=True, line=1.08)
        text_at(s, x + 0.20, yy + 0.95, tw - 0.40, 0.73, body, size=8.7,
                color=SLATE_600, line=1.16)
        if i < 3:
            arrow(s, x + tw + 0.02, yy + 0.82, 0.15, 0.15, color=SLATE_300)
        if i == 3:
            arrow(s, x + tw / 2 - 0.06, yy + h + 0.025, 0.16, 0.18,
                  color=SLATE_300, shape_type=MSO_SHAPE.DOWN_ARROW)
        if i in (4, 5):
            arrow(s, x - 0.18, yy + 0.82, 0.15, 0.15, color=SLATE_300,
                  shape_type=MSO_SHAPE.LEFT_ARROW)

    note_strip(s, M, y + 4.50, CW, 0.62,
               "pending → accepted / rejected → completed / cancelled. Only a "
               "completed booking can be reviewed, and the reviewer name is read from "
               "the users table — never from the request body.",
               lead="Booking lifecycle:", fill=EMERALD_LT, border=EMERALD,
               lead_color=EMERALD_DK)

    footer(s, 5, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader).\n\n"
             "Walk the judges through the seven steps. Emphasise step 7: the review "
             "name comes from the authenticated user, so a reviewer can never "
             "impersonate somebody else, and one booking can only be reviewed once.")
    return s


# ============================================================== SLIDE 6 ======
def slide_frontend(prs):
    s = new_slide(prs, bg=WHITE)
    y = header(s, "Frontend development & user experience",
               "Responsive UI, reusable components",
               sub="The frontend is the part of the product students and parents actually touch — "
                   "so it is where most of our design effort went.")
    presenter_tag(s, "Hephzibah Uchechukwu", "Team Leader · Frontend & UI", y=0.40)

    items = [
        ("Next.js 16 · App Router", "File routes, server-rendered pages and API handlers.",
         "app/: 15 page routes plus /api handlers."),
        ("React 19 · TypeScript 5", "Component UI with strict static type-checking.",
         "21 shared components; domain types in lib/types.ts."),
        ("Tailwind CSS 4", "Utility CSS with brand tokens and responsive breakpoints.",
         "tailwind.config.js: palette, shadows and keyframes."),
        ("Framer Motion 14", "Declarative transitions for animated interface states.",
         "HeroSlider, BookingModal and tutor-grid transitions."),
        ("lucide-react", "A tree-shakeable SVG icon set, styled with Tailwind.",
         "Navbar, verified badges, search, budget and status icons."),
        ("next/font + design tokens", "Self-hosted fonts, loaded without layout shift.",
         "app/layout.tsx: Inter body + Plus Jakarta Sans headings."),
    ]
    cw, gap = 2.42, 0.16
    for i, (t, what, where) in enumerate(items):
        col, row = i % 3, i // 3
        x = M + col * (cw + gap)
        yy = y + 0.36 + row * 1.44
        card(s, x, yy, cw, 1.32, fill=SLATE_50, border=SLATE_200, radius=0.07)
        rect(s, x, yy, cw, 0.05, fill=[BLUE, EMERALD, AMBER, ROSE, NAVY, BLUE][i])
        text_at(s, x + 0.20, yy + 0.13, cw - 0.4, 0.32, t, size=10.2,
                color=SLATE_900, bold=True, font=FONT_SB, line=1.03)
        text_at(s, x + 0.20, yy + 0.49, cw - 0.4, 0.31, what, size=8.2,
                color=BLUE, bold=True, line=1.12)
        text_at(s, x + 0.20, yy + 0.82, cw - 0.4, 0.43, where, size=7.7,
                color=SLATE_600, line=1.10)

    # right column
    rx = M + 3 * (cw + gap) + 0.06
    rw = SW - M - rx
    card(s, rx, y + 0.36, rw, 1.32, fill=NAVY, border=None, radius=0.07)
    text_at(s, rx + 0.22, y + 0.52, rw - 0.44, 0.3, "FRONTEND → BACKEND",
            size=10, color=EMERALD, bold=True, caps=True, spacing=1.1)
    text_at(s, rx + 0.22, y + 0.84, rw - 0.44, 0.78,
            "Client components call the API with fetch() and send the JWT as an "
            "Authorization: Bearer header from localStorage. Responses are parsed "
            "into React state; loading, empty and error states are handled in the "
            "component itself.",
            size=9.5, color=RGBColor(0xCB, 0xD5, 0xE1), line=1.22)

    card(s, rx, y + 1.80, rw, 1.32, fill=WHITE, border=SLATE_200, radius=0.07)
    text_at(s, rx + 0.22, y + 1.96, rw - 0.44, 0.28, "Responsive by default",
            size=11.5, color=SLATE_900, bold=True, font=FONT_SB)
    text_at(s, rx + 0.22, y + 2.26, rw - 0.44, 0.80,
            "Tailwind breakpoints drive a sticky, blurred navbar, a slide-in mobile "
            "filter drawer, a 1→2→4 column homepage grid, a 1→2→3 column directory "
            "and bottom-sheet booking modals on small screens.",
            size=9.5, color=SLATE_600, line=1.22)

    yb = y + 3.30
    section_label(s, M, yb, CW, "Product UI illustration — reflects shipped components, not a live screenshot")
    # A clearly-labelled explanatory mockup built from shapes because no browser
    # screenshot could be captured in this environment. All labels mirror the
    # actual Navbar, tutor filters, TutorCard and profile/booking affordances.
    bx, by, bw, bh = M, yb + 0.30, CW, 1.38
    card(s, bx, by, bw, bh, fill=SLATE_50, border=SLATE_300, radius=0.06)
    rect(s, bx, by, bw, 0.24, fill=NAVY, radius=0.06)
    icon_badge(s, bx + 0.14, by + 0.045, 0.15, "✦", bg=EMERALD, fg=WHITE, fsize=7, radius=0.5)
    text_at(s, bx + 0.35, by + 0.045, 1.65, 0.16, "TutorConnect NG", size=8,
            color=WHITE, bold=True)
    text_at(s, bx + 2.10, by + 0.045, 2.4, 0.16, "Tutors   Parents & Students", size=7.5,
            color=RGBColor(0xD8, 0xE4, 0xFF))
    chip(s, bx + bw - 2.28, by + 0.04, 0.88, 0.16, "Log in", fill=WHITE,
         fg=NAVY, size=7.2)
    chip(s, bx + bw - 1.25, by + 0.04, 1.08, 0.16, "Sign up", fill=EMERALD,
         fg=WHITE, size=7.2)
    # Filter sidebar
    fx, fy, fww, fh = bx + 0.14, by + 0.34, 1.55, 0.91
    card(s, fx, fy, fww, fh, fill=WHITE, border=SLATE_200, radius=0.04)
    text_at(s, fx + 0.10, fy + 0.08, fww - 0.20, 0.16, "FILTERS", size=7.2,
            color=NAVY, bold=True, caps=True, spacing=0.7)
    for j, lab in enumerate(["Subject  ▾", "State / location  ▾", "Budget  ₦2k–₦25k", "Availability  ▾"]):
        text_at(s, fx + 0.10, fy + 0.28 + j * 0.15, fww - 0.20, 0.14, lab,
                size=6.5, color=SLATE_600)
        rect(s, fx + 0.10, fy + 0.43 + j * 0.15, fww - 0.20, 0.006,
             fill=SLATE_100, shape_type=MSO_SHAPE.RECTANGLE)
    # Three generic tutor cards: no invented people, rates or review counts.
    mock_tutors = ["tutor-02.jpg", "tutor-05.jpg", "tutor-08.jpg"]
    cardx = fx + fww + 0.18
    cw_m = (bw - (cardx - bx) - 0.18 - 0.24) / 3
    for i, photo in enumerate(mock_tutors):
        cx = cardx + i * (cw_m + 0.12)
        cy = fy
        card(s, cx, cy, cw_m, fh, fill=WHITE, border=SLATE_200, radius=0.04)
        picture_cover(s, photo, cx + 0.07, cy + 0.08, 0.52, 0.70)
        text_at(s, cx + 0.68, cy + 0.08, cw_m - 0.78, 0.16, "Verified tutor", size=7.0,
                color=SLATE_900, bold=True)
        text_at(s, cx + 0.68, cy + 0.25, cw_m - 0.78, 0.14, "Subject · curriculum", size=6.3,
                color=SLATE_500)
        chip(s, cx + 0.68, cy + 0.43, 0.78, 0.17, "₦ / hour", fill=BLUE_LT,
             fg=NAVY, size=6.4)
        text_at(s, cx + 0.68, cy + 0.65, cw_m - 0.78, 0.13, "Profile   ·   Book", size=6.6,
                color=EMERALD_DK, bold=True)
    text_at(s, M, yb + 1.70, CW, 0.22,
            "Illustration only — it is not a website screenshot and contains no live tutor data. "
            "The layout represents the shipped Navbar, filters, TutorCard and booking actions.",
            size=8.5, color=SLATE_400, italic=True)

    footer(s, 6, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader) — frontend section.\n\n"
             "Point out the 3x2 grid: for every technology, what it is and exactly "
             "where we used it. The right-hand panel is the contract with the "
             "backend: fetch plus a Bearer JWT, with loading, empty and error "
             "states handled in the component. The browser panel below is a clearly "
             "labelled explanatory mockup built from the shipped interface, not a "
             "live screenshot or tutor record.")
    return s


# ============================================================== SLIDE 7 ======
def slide_smart_match(prs):
    s = new_slide(prs, bg=WHITE)
    y = header(s, "Smart Tutor Matching & tutor discovery",
               "Transparent, rules-based tutor matching",
               sub="The learner states what they need; the engine filters eligible tutors, "
                   "scores each one against their preferences and explains every match.")
    presenter_tag(s, "Hephzibah Uchechukwu", "Team Leader · Frontend & UI", y=0.40)

    flow = [
        ("Learner's needs", "Subject, budget, curriculum,\nlocation, availability", NAVY),
        ("Preference form", "/smart-match\n5 criteria collected", NAVY_800),
        ("Hard filter", "Subject + budget\nmust be satisfied", BLUE),
        ("Weighted score", "Curriculum 30 · Location 20\nAvailability 10 · Verified 5", EMERALD_DK),
        ("Ranked results", "Score → rating → price\nwith reasons shown", EMERALD),
        ("Profile & book", "Open profile, save tutor,\nor request a session", AMBER),
    ]
    fw, fgap = 1.88, 0.13
    for i, (t, sub, c) in enumerate(flow):
        x = M + i * (fw + fgap)
        card(s, x, y + 0.30, fw, 1.30, fill=WHITE, border=c, radius=0.08)
        rect(s, x, y + 0.30, fw, 0.05, fill=c)
        numbered_node(s, x + fw / 2 - 0.17, y + 0.43, 0.34, i + 1, fill=c, size=10)
        text_at(s, x + 0.10, y + 0.83, fw - 0.2, 0.26, t, size=9.8,
                color=SLATE_900, bold=True, font=FONT_SB, align=PP_ALIGN.CENTER)
        text_at(s, x + 0.10, y + 1.10, fw - 0.2, 0.43, sub.replace("\n", "  "),
                size=8, color=SLATE_500, align=PP_ALIGN.CENTER, line=1.14)
        if i < len(flow) - 1:
            arrow(s, x + fw + 0.005, y + 0.95, 0.115, 0.16, color=SLATE_300)

    yb = y + 1.78
    lw = 6.35
    section_label(s, M, yb, lw, "Matching criteria actually implemented")
    table = [
        ("Subject  (required)", "Hard filter — must teach selected subject", "gate", BLUE),
        ("Max hourly budget ₦  (required)", "Hard filter — hourly_rate ≤ maxBudget", "gate", BLUE),
        ("Preferred curriculum", "Exact tutor curriculum match", "30", EMERALD),
        ("Preferred location", "State / area match, or online mode", "20", EMERALD),
        ("Preferred availability", "Weekday or weekend slot overlap", "10", EMERALD),
        ("Verified tutor", "tutor_profiles.is_verified = TRUE", "5", AMBER),
        ("Rating ≥ 4", "rating_avg ≥ 4; total_reviews > 0", "5", AMBER),
    ]
    hdr_y = yb + 0.30
    rect(s, M, hdr_y, lw, 0.27, fill=SLATE_900, radius=0.04,
         shape_type=MSO_SHAPE.RECTANGLE)
    text_at(s, M + 0.18, hdr_y + 0.06, 3.0, 0.2, "CRITERION", size=8.5,
            color=WHITE, bold=True, caps=True, spacing=0.8)
    text_at(s, M + 3.25, hdr_y + 0.06, 2.3, 0.2, "RULE", size=8.5, color=WHITE,
            bold=True, caps=True, spacing=0.8)
    text_at(s, M + lw - 0.95, hdr_y + 0.06, 0.8, 0.2, "POINTS", size=8.5,
            color=WHITE, bold=True, caps=True, spacing=0.8, align=PP_ALIGN.RIGHT)
    ry = hdr_y + 0.27
    for i, (k, v, pts, c) in enumerate(table):
        h = 0.27
        rect(s, M, ry, lw, h, fill=(WHITE if i % 2 == 0 else SLATE_50),
             shape_type=MSO_SHAPE.RECTANGLE)
        text_at(s, M + 0.18, ry + 0.045, 3.0, 0.22, k, size=8.8, color=SLATE_900,
                bold=True)
        text_at(s, M + 3.25, ry + 0.045, 2.45, 0.22, v, size=8.5, color=SLATE_600)
        text_at(s, M + lw - 0.95, ry + 0.045, 0.8, 0.22, pts, size=8.8, color=c,
                bold=True, align=PP_ALIGN.RIGHT)
        ry += h
    line(s, M, ry, M + lw, ry, color=SLATE_200, width=1)

    rx = M + lw + 0.30
    rw = CW - lw - 0.30
    mono(s, rx, yb + 0.30, rw, 2.16, [
        ("lib/matching/smart-match.ts", ""),
        ("", ""),
        ("normalize()", "  → NFKD, lower-case, strip emoji"),
        ("SUBJECT_GROUPS", "  → 6 subject families + synonyms"),
        ("", "    (\"maths\" ≡ \"mathematics\" ≡"),
        ("", "     \"further mathematics\")"),
        ("", ""),
        ("filter()", "  → subject + budget are gates"),
        ("map()", "  → weighted points + reasons[]"),
        ("sort()", "  → score ↓, rating ↓, price ↑"),
        ("", ""),
        ("score = round(earned / possible × 100)", ""),
    ], size=9, title="HOW THE ENGINE WORKS")

    note_strip(s, M, yb + 2.52, CW, 0.68,
               "No ML model, LLM, embeddings or predictive service appears in the dependencies. "
               "‘Smart’ is a deterministic rules engine; every result exposes its score and reasons.",
               lead="Accuracy note:", fill=AMBER_LT, border=AMBER,
               lead_color=SLATE_900)

    footer(s, 7, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader) — Smart Tutor Match.\n\n"
             "Six stages left to right. Two criteria are gates (subject and budget); "
             "the rest add weighted points, and the result is a percentage plus a "
             "plain-English reason list. Be explicit with the judges: this is a "
             "rules engine implemented in lib/matching/smart-match.ts, not a trained "
             "model — and that is a strength, because every ranking can be explained.")
    return s


# ============================================================== SLIDE 8 ======
def slide_backend(prs):
    s = new_slide(prs, bg=SLATE_50)
    y = header(s, "Backend development & API architecture",
               "How a request moves through our system",
               sub="The backend is a set of HTTP route handlers that validate, authorise, "
                   "query PostgreSQL and return JSON.")
    presenter_tag(s, "Chioma Helen Ezeufonna", "Backend · APIs · Auth", y=0.40)

    arch = [
        ("React client", "Browser — client components\nin app/ and components/", SLATE_700),
        ("Route handlers", "app/api/*/route.ts\nruntime = \"nodejs\"", NAVY),
        ("Business rules", "Validation, role checks,\nownership checks", BLUE),
        ("Neon SQL client", "neon() tagged template\nover HTTP", EMERALD_DK),
        ("PostgreSQL", "10 tables, 4 enums,\n2 triggers, 17 explicit indexes", EMERALD),
    ]
    aw, agap = 2.16, 0.32
    for i, (t, sub, c) in enumerate(arch):
        x = M + i * (aw + agap)
        card(s, x, y + 0.34, aw, 1.24, fill=WHITE, border=c, radius=0.08)
        rect(s, x, y + 0.34, aw, 0.055, fill=c)
        text_at(s, x + 0.14, y + 0.54, aw - 0.28, 0.3, t, size=12,
                color=SLATE_900, bold=True, font=FONT_SB, align=PP_ALIGN.CENTER)
        text_at(s, x + 0.12, y + 0.90, aw - 0.24, 0.58, sub, size=8.8,
                color=SLATE_500, align=PP_ALIGN.CENTER, line=1.18)
        if i < len(arch) - 1:
            arrow(s, x + aw + 0.05, y + 0.88, 0.22, 0.18, color=SLATE_300)
    resp = rect(s, M + 0.5, y + 1.68, CW - 1.0, 0.36, fill=BLUE_LT, radius=0.30)
    text_at(s, M + 0.5, y + 1.755, CW - 1.0, 0.26,
            "Response path:  JSON body  →  client state update   ·   status codes "
            "200 · 201 · 400 · 401 · 403 · 404 · 409 · 413 · 500 · 503",
            size=9.5, color=NAVY, bold=True, align=PP_ALIGN.CENTER)

    yb = y + 2.28
    lw = 6.05
    section_label(s, M, yb, lw, "Real endpoints in the repository")
    rect(s, M, yb + 0.34, lw, 0.28, fill=SLATE_900, shape_type=MSO_SHAPE.RECTANGLE)
    text_at(s, M + 0.16, yb + 0.385, 1.5, 0.2, "METHOD + PATH", size=8.5,
            color=WHITE, bold=True, caps=True, spacing=0.8)
    text_at(s, M + 2.05, yb + 0.385, 3.8, 0.2, "WHAT IT DOES", size=8.5,
            color=WHITE, bold=True, caps=True, spacing=0.8)
    eps = [
        ("GET  /api/tutors", "Filterable public directory — only admin-verified tutors", BLUE),
        ("GET · POST · PATCH · DELETE  /api/bookings", "Create, list, edit (pending only) and decide bookings", EMERALD),
        ("POST · GET · PUT · DELETE  /api/auth", "Signup/login, profile, admin review, documents, availability", AMBER),
        ("GET · POST  /api/reviews", "One review per completed booking; rating validated 1–5", ROSE),
        ("GET · POST  /api/messages", "Private 1-to-1 threads, scoped to the signed-in account", NAVY),
    ]
    ry = yb + 0.62
    for i, (k, v, c) in enumerate(eps):
        h = 0.46
        rect(s, M, ry, lw, h, fill=(WHITE if i % 2 == 0 else SLATE_50),
             shape_type=MSO_SHAPE.RECTANGLE)
        rect(s, M, ry, 0.04, h, fill=c)
        text_at(s, M + 0.16, ry + 0.10, 1.9, 0.28, k, size=9, color=SLATE_900,
                bold=True, line=1.1)
        text_at(s, M + 2.05, ry + 0.10, lw - 2.2, 0.3, v, size=9, color=SLATE_600,
                line=1.1)
        ry += h

    rx = M + lw + 0.32
    rw = CW - lw - 0.32
    section_label(s, rx, yb, rw, "Authentication, authorisation & error handling")
    bullet_list(s, rx, yb + 0.36, rw, [
        ("Passwords", "bcryptjs hashes use a 10-round cost factor."),
        ("JWT", "Signed with JWT_SECRET; expires in 7 days; sent as a Bearer token."),
        ("Role gates", "Admin actions check role; unauthenticated = 401, wrong role = 403."),
        ("Ownership", "Booking edits and decisions verify student, tutor or admin ownership."),
        ("Validation", "400 for malformed JSON, missing fields, weak password or bad status."),
        ("Parameterized SQL", "neon() tagged templates parameterise supplied values."),
        ("No database", "DATABASE_URL absent → 503 for booking/chat; tutor list is empty."),
    ], size=9, gap=0.075)

    footer(s, 8, TOTAL)
    notes(s, "Chioma Helen Ezeufonna (Backend).\n\n"
             "The architecture is one request path: client → route handler → business "
             "rules → Neon → PostgreSQL → JSON. On the left are the five real "
             "endpoints. On the right is the security story: bcrypt hashing, a 7-day "
             "JWT, role gates on every admin action, ownership checks on every "
             "booking change, and parameterised SQL throughout.")
    return s


# ============================================================== SLIDE 9 ======
def slide_database(prs):
    s = new_slide(prs, bg=WHITE)
    y = header(s, "Database design & data management",
               "PostgreSQL data model: 10 connected tables",
               sub="PostgreSQL is the relational database that stores the data; Neon is the "
                   "managed hosting service that runs it and exposes it over HTTP.")
    presenter_tag(s, "Uzochukwu Mary Cynthia Enyemakachukwu", "Database Design",
                  y=0.32, w=5.2)

    # ---- ER sketch -------------------------------------------------------
    boxes = [
        (M, y + 0.30, 1.95, 0.72, "users", "role · account_status\nemail · state · city", NAVY),
        (M + 2.48, y + 0.30, 2.15, 0.72, "tutor_profiles", "hourly_rate · curriculum\nis_verified · rating_avg", BLUE),
        (M + 5.16, y + 0.30, 2.05, 0.72, "bookings", "student_id · tutor_id\nstatus · date · total_price", EMERALD_DK),
        (M + 7.74, y + 0.30, 1.95, 0.72, "reviews", "rating 1–5 · comment\nUNIQUE booking_id", ROSE),
        (M + 10.22, y + 0.30, 1.87, 0.72, "messages", "sender / recipient keys\nbody · created_at", AMBER),
        (M, y + 1.40, 1.95, 0.72, "parent_profiles", "one child profile · age\nbudget · level · learning mode", EMERALD),
        (M + 2.48, y + 1.40, 2.15, 0.72, "tutor_subjects", "subject_name · level\nmany subjects per tutor", BLUE),
        (M + 5.16, y + 1.40, 2.05, 0.72, "tutor_availability", "day_of_week 0–6\nstart_time · end_time", BLUE),
        (M + 7.74, y + 1.40, 1.95, 0.72, "tutor_documents", "user_id · doc_type\nfile_data · photo", AMBER),
        (M + 10.22, y + 1.40, 1.87, 0.72, "tutor_verifications", "user_id PK · status\npending / approved / declined", AMBER),
    ]
    for x, yy, w, h, name, sub, c in boxes:
        card(s, x, yy, w, h, fill=WHITE, border=c, radius=0.08)
        rect(s, x, yy, w, 0.05, fill=c)
        text_at(s, x + 0.10, yy + 0.13, w - 0.2, 0.24, name, size=10.5,
                color=SLATE_900, bold=True, font=FONT_SB, align=PP_ALIGN.CENTER)
        text_at(s, x + 0.08, yy + 0.38, w - 0.16, 0.3, sub, size=7.8,
                color=SLATE_500, align=PP_ALIGN.CENTER, line=1.12)

    def link(x1, y1, x2, y2, label=None, lx=None, ly=None):
        line(s, x1, y1, x2, y2, color=SLATE_400, width=1.25)
        if label:
            text_at(s, lx, ly, 0.45, 0.2, label, size=7.2, color=SLATE_500,
                    bold=True, align=PP_ALIGN.CENTER)

    # users -> tutor_profiles (1:1)
    link(M + 1.95, y + 0.66, M + 2.48, y + 0.66, "1:1", M + 1.90, y + 0.36)
    # users -> parent_profiles (1:1)
    link(M + 0.98, y + 1.02, M + 0.98, y + 1.40, "1:1", M + 1.04, y + 1.08)
    # tutor_profiles -> tutor_subjects (1:N)
    link(M + 3.55, y + 1.02, M + 3.55, y + 1.40, "1:N", M + 3.60, y + 1.08)
    # tutor_profiles -> tutor_availability (1:N)
    link(M + 4.40, y + 1.02, M + 5.90, y + 1.40, "1:N", M + 4.72, y + 1.08)
    # tutor_profiles -> bookings (1:N)
    link(M + 4.63, y + 0.48, M + 5.16, y + 0.48, "1:N", M + 4.66, y + 0.18)
    # bookings -> reviews (1:1)
    link(M + 7.21, y + 0.66, M + 7.74, y + 0.66, "1:1", M + 7.22, y + 0.36)
    # Credential documents and verification records are user-owned; their
    # user_id references are called out in the entity labels below.
    # messages standalone
    text_at(s, M + 10.22, y + 1.12, 1.87, 0.22, "opaque party keys", size=7.5,
            color=SLATE_400, align=PP_ALIGN.CENTER, italic=True)

    yb = y + 2.30
    cols = [
        ("Table responsibilities", [
            ("users", "every account + role + review state"),
            ("tutor_profiles", "1:1 tutor data, rate, verification"),
            ("parent_profiles", "one child profile, budget, learning mode"),
            ("tutor_subjects", "many subjects per tutor, with level"),
            ("tutor_availability", "recurring weekly time slots"),
            ("bookings", "session requests + status + price"),
            ("reviews", "booking-linked; admin may post unlinked feedback"),
            ("messages", "private threads between two parties"),
            ("tutor_documents", "uploaded credential photos"),
            ("tutor_verifications", "admin review outcome per tutor"),
        ]),
        ("Schema objects & constraints", [
            ("4 enums", "role · status · session mode · curriculum"),
            ("2 triggers", "rating totals on review; updated_at on booking"),
            ("17 indexes", "role/state · subject · rate · booking · chat lookups"),
            ("UUID keys", "pgcrypto · gen_random_uuid()"),
            ("Foreign keys", "CASCADE; SET NULL for optional subject"),
            ("CHECKs", "rating 1–5 · day 0–6 · end > start"),
            ("Money", "hourly_rate + total_price: NUMERIC(10,2)"),
        ]),
        ("How the app reads and writes", [
            ("db/neon.ts", "one HTTP neon() client; hasDatabase guard"),
            ("db/tutors.ts", "approved-tutor reads + homepage aggregates"),
            ("db/bookings.ts", "maps SQL rows to the shared Booking type"),
            ("db/migrate.ts", "lazy, non-destructive schema guards"),
            ("Neon service", "Neon hosts managed PostgreSQL and exposes an HTTP driver for serverless."),
        ]),
    ]
    colw = (CW - 2 * 0.26) / 3
    for i, (title, rows) in enumerate(cols):
        x = M + i * (colw + 0.26)
        card(s, x, yb, colw, 2.66, fill=SLATE_50, border=SLATE_200, radius=0.06)
        rect(s, x, yb, colw, 0.05, fill=[BLUE, EMERALD, NAVY][i])
        text_at(s, x + 0.20, yb + 0.16, colw - 0.4, 0.26, title, size=10.8,
                color=SLATE_900, bold=True, font=FONT_SB)
        cy = yb + 0.48
        if i == 0:
            for k, v in rows:
                line_box, line_tf = tb(s, x + 0.20, cy, colw - 0.40, 0.17)
                p = line_tf.paragraphs[0]
                p.line_spacing = 1.0
                run(p, k + "  ·  ", size=7.6, color=NAVY, bold=True)
                run(p, v, size=7.6, color=SLATE_600)
                cy += 0.195
        else:
            for k, v in rows:
                body_w = colw - 1.25
                h = 0.10 + text_h(v, body_w, 7.8, 1.12)
                text_at(s, x + 0.18, cy, 1.04, h, k, size=7.7, color=NAVY,
                        bold=True, line=1.08)
                text_at(s, x + 1.22, cy, body_w, h, v, size=7.8,
                        color=SLATE_600, line=1.12)
                cy += h + 0.02

    footer(s, 9, TOTAL)
    notes(s, "Uzochukwu Mary Cynthia Enyemakachukwu (Database).\n\n"
             "Ten tables built around one identity table. users is the hub; "
             "tutor_profiles and parent_profiles extend it one-to-one; bookings ties "
             "a student, a tutor and a subject together; reviews attach one-to-one "
             "to a completed booking; messages is deliberately decoupled with "
             "opaque party keys. Two triggers keep the data honest automatically, "
             "and db/migrate.ts lets us add columns safely on an existing production "
             "database without a manual migration window.")
    return s


# ============================================================= SLIDE 10 ======
def slide_stack(prs):
    s = new_slide(prs, bg=SLATE_50)
    y = header(s, "Technologies, frameworks & tooling",
               "The technology stack",
               sub="No framework was added “just in case”. Each dependency below earns "
                   "its place in a specific screen or route.")

    rows = [
        ("Framework", "Next.js 16.3.8 · App Router",
         "Routing, server components and API route handlers in one deployable app.",
         "app/ routes + app/api/*/route.ts", NAVY),
        ("UI runtime", "React 19.2.8",
         "Component model for interactive screens; 'use client' marks the interactive ones.",
         "21 components; dashboards, booking modal, chat", BLUE),
        ("Language", "TypeScript 5 (strict)",
         "Static type safety across domain types, API payloads and React props.",
         "lib/types.ts, typed sql row mappers, strict tsconfig", EMERALD),
        ("Styling", "Tailwind CSS v4",
         "Utility-first CSS driven by design tokens instead of a custom stylesheet.",
         "tailwind.config.js palette, shadows, keyframes", EMERALD_DK),
        ("Animation", "Framer Motion 14",
         "Declarative, interruptible transitions without hand-written CSS animation.",
         "HeroSlider, BookingModal, tutor grid layout", AMBER),
        ("Icons", "lucide-react 1.50",
         "Consistent, accessible SVG icon set that inherits Tailwind colour tokens.",
         "Navbar, badges, empty states, dashboards", ROSE),
        ("Database", "@neondatabase/serverless 1.2",
         "HTTP-based Postgres driver — no TCP socket pooling in a serverless runtime.",
         "db/neon.ts, db/tutors.ts, db/bookings.ts", NAVY_800),
        ("Auth", "bcryptjs 3 · jsonwebtoken 9",
         "Password hashing and stateless signed tokens.",
         "app/api/auth/route.ts — signup, login, role gates", BLUE),
        ("Deployment", "Vercel (zero config)",
         "Detects Next.js, runs next build, deploys /api as serverless Node functions.",
         "runtime = \"nodejs\" on every route", EMERALD),
        ("Quality", "ESLint 9 + eslint-config-next",
         "Static analysis for React and TypeScript correctness, run as npm run lint.",
         "eslint.config.mjs (core-web-vitals + typescript)", SLATE_700),
    ]
    colw = (CW - 0.30) / 2
    for i, (layer, tech, what, where, c) in enumerate(rows):
        col, row = i // 5, i % 5
        x = M + col * (colw + 0.30)
        yy = y + 0.36 + row * 0.83
        card(s, x, yy, colw, 0.75, fill=WHITE, border=SLATE_200, radius=0.06)
        rect(s, x, yy, 0.05, 0.75, fill=c)
        chip(s, x + 0.18, yy + 0.12, 1.02, 0.20, layer.upper(), fill=SLATE_100,
             fg=SLATE_600, size=7.5)
        text_at(s, x + 1.30, yy + 0.11, colw - 1.5, 0.25, tech, size=11,
                color=SLATE_900, bold=True, font=FONT_SB)
        text_at(s, x + 0.18, yy + 0.37, colw - 0.36, 0.19, what, size=8.8,
                color=SLATE_600, line=1.12)
        text_at(s, x + 0.18, yy + 0.57, colw - 0.36, 0.16, "Used in:  " + where,
                size=8, color=c, bold=True)

    note_strip(s, M, y + 4.52, CW, 0.58,
               "Next 16.3.8 · React 19.2.8 · TypeScript 5 · Tailwind 4 · Motion 14 · "
               "lucide-react 1.50 · Neon driver 1.2 · bcryptjs 3 · JWT 9 · ESLint 9",
               lead="Versions in package.json:", fill=BLUE_LT,
               border=RGBColor(0xBF, 0xDB, 0xFE), lead_color=NAVY, fg=SLATE_600,
               size=9.4)

    footer(s, 10, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader).\n\n"
             "This is the full dependency list — ten layers, nothing decorative. "
             "Each row says what the technology is and where in our code it is "
             "actually used, so the judges can verify every claim against the "
             "repository.")
    return s


# ============================================================= SLIDE 11 ======
def slide_qa(prs):
    s = new_slide(prs, bg=WHITE)
    y = header(s, "Testing, quality assurance & deployment",
               "Evidence, deployment and honest caveats",
               sub="What we actually ran, what we could not run, and the deployment "
                   "configuration that runs the site today.")
    presenter_tag(s, "Bodman Ebuka Precious", "Deployment · Testing & QA", y=0.40)

    lw = 6.15
    section_label(s, M, y + 0.36, lw, "What we actually ran")
    checks = [
        ("npx tsc --noEmit", "Pass in this inspection: strict TypeScript check, no errors.", True, EMERALD),
        ("npm run lint", "Pass in this inspection: ESLint 9 + Next.js core-web-vitals / TypeScript rules.", True, EMERALD),
        ("npm run build", "Attempted; blocked here when next/font could not fetch Google Fonts (network restriction).", False, AMBER),
        ("Automated tests", "No unit, integration or end-to-end test files or runner config are committed.", False, ROSE),
        ("Continuous integration", "No GitHub Actions or other CI workflow is present in the repository.", False, AMBER),
    ]
    cy = y + 0.70
    for cmd, desc, ok, c in checks:
        h = 0.55
        card(s, M, cy, lw, h, fill=(SLATE_50 if ok else (ROSE_LT if c == ROSE else AMBER_LT)),
             border=(SLATE_200 if ok else c), radius=0.07)
        icon_badge(s, M + 0.18, cy + 0.12, 0.30, ("✓" if ok else "!"), bg=WHITE,
                   fg=c, fsize=11.5, radius=0.5)
        text_at(s, M + 0.60, cy + 0.08, 2.35, 0.22, cmd, size=9.5,
                color=SLATE_900, bold=True)
        text_at(s, M + 0.60, cy + 0.29, lw - 0.8, 0.23, desc, size=8.5,
                color=SLATE_600, line=1.12)
        cy += h + 0.07

    note_strip(s, M, cy + 0.05, lw, 0.63,
               "The only checks completed for this deck were TypeScript and ESLint. "
               "We do not claim runtime or role-by-role tests. The production build "
               "could not finish in this network-restricted sandbox.",
               lead="Testing status:", fill=ROSE_LT, border=ROSE, lead_color=ROSE,
               size=9.3)

    rx = M + lw + 0.30
    rw = CW - lw - 0.30
    section_label(s, rx, y + 0.36, rw, "Deployment configuration")
    kv_row(s, rx, y + 0.70, rw, 0.62, "Vercel — zero configuration",
           "Vercel detects Next.js, runs next build and publishes /api routes as Node functions.",
           accent=NAVY, vsize=9.3)
    kv_row(s, rx, y + 1.40, rw, 0.62, "Runtime pinning",
           "runtime = nodejs for route handlers using bcryptjs and jsonwebtoken.",
           accent=BLUE, vsize=9.3)
    kv_row(s, rx, y + 2.10, rw, 0.85, "Environment variables (3 required)",
           "DATABASE_URL — pooled Neon connection string\n"
           "JWT_SECRET — secret used to sign every token\n"
           "NEXT_PUBLIC_APP_URL — public base URL of the deployment", accent=EMERALD,
           vsize=9.0)
    kv_row(s, rx, y + 2.96, rw, 0.76, "Operational checks in code",
           "hasDatabase guard · force-dynamic homepage + /api/tutors · "
           "503 when the DB is missing · no vercel.json needed.",
           accent=AMBER, vsize=9.1)

    section_label(s, rx, y + 3.74, rw, "Genuine challenges we hit")
    bullet_list(s, rx, y + 4.08, rw, [
        ("Route protection", "the dashboards are guarded client-side; the README states Next.js middleware is still required for production."),
        ("Cold starts", "without DATABASE_URL, auth and chat fall back to an in-memory store that resets on redeploy."),
        ("Build-time fonts", "next/font fetches from fonts.googleapis.com, so a network-restricted build environment fails early."),
    ], size=9.5, gap=0.10, marker=AMBER)

    footer(s, 11, TOTAL)
    notes(s, "Bodman Ebuka Precious (Deployment, Testing & QA).\n\n"
             "Distinguish repository evidence from claims. This inspection ran strict "
             "TypeScript checking and ESLint successfully. A production build was "
             "attempted but stopped when next/font could not reach Google Fonts from "
             "the sandbox. No unit, integration, end-to-end or CI suite is committed, "
             "so do not claim runtime test coverage. The README documents Vercel's "
             "zero-config deployment with DATABASE_URL, JWT_SECRET and "
             "NEXT_PUBLIC_APP_URL; the public URL was supplied for this presentation.")
    return s


# ============================================================= SLIDE 12 ======
def slide_team(prs):
    s = new_slide(prs, bg=SLATE_50)
    y = header(s, "Our team", "Four people, four owned areas",
               sub="One shared repository and one shared Next.js codebase — these are areas "
                   "of ownership, not separate projects.")

    members = [
        ("HU", "Hephzibah Uchechukwu", "Team Leader",
         ["Frontend development & user interface", "Smart Tutor Matching and tutor discovery",
          "Revenue model", "Conclusion and closing remarks"],
         "Opens the presentation and presents slides 2–7, 10 and 13–15.", NAVY),
        ("CE", "Chioma Helen Ezeufonna", "Backend Developer",
         ["Backend development", "API routes and request handling", "Server-side functionality",
          "Authentication and role-based authorisation"],
         "Presents slide 8 — the API architecture and security model.", BLUE),
        ("UM", "Uzochukwu Mary Cynthia Enyemakachukwu", "Database Designer",
         ["Database design and schema", "Data management", "Database structure and relationships",
          "Database-related implementation"],
         "Presents slide 9 — the schema, triggers and data flow.", EMERALD),
        ("BP", "Bodman Ebuka Precious", "Deployment & QA",
         ["Deployment and deployment configuration", "System inspection", "Testing and quality assurance",
          "Operational checks and limitations"],
         "Presents slide 11 — testing evidence and the Vercel/Neon setup.", AMBER),
    ]
    cw, gap = 2.90, 0.19
    for i, (ini, nm, role, resp, pres, c) in enumerate(members):
        x = M + i * (cw + gap)
        h = 4.22
        card(s, x, y + 0.36, cw, h, fill=WHITE, border=SLATE_200, radius=0.08)
        rect(s, x, y + 0.36, cw, 0.06, fill=c)
        badge = rect(s, x + 0.24, y + 0.62, 0.72, 0.72, fill=c, radius=0.30,
                     shape_type=MSO_SHAPE.OVAL)
        tf = badge.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run(p, ini, size=17, color=WHITE, bold=True, font=FONT_SB)
        name_size = 10.4 if len(nm) > 30 else 12.0
        text_at(s, x + 0.24, y + 1.48, cw - 0.48, 0.50, nm, size=name_size,
                color=SLATE_900, bold=True, font=FONT_SB, line=1.06)
        chip(s, x + 0.24, y + 2.02, 1.86, 0.28, role.upper(), fill=SLATE_100,
             fg=NAVY, size=8.5, align=PP_ALIGN.CENTER)
        cy = y + 2.46
        for r in resp:
            h2 = text_h(r, cw - 0.72, 8.6, 1.14)
            rect(s, x + 0.26, cy + 0.05, 0.09, 0.09, fill=c, radius=0.5)
            text_at(s, x + 0.48, cy, cw - 0.74, h2, r, size=8.6, color=SLATE_600,
                    line=1.14)
            cy += h2 + 0.06
        line(s, x + 0.24, y + 3.58, x + cw - 0.24, y + 3.58, color=SLATE_200, width=0.75)
        text_at(s, x + 0.24, y + 3.70, cw - 0.48, 0.76, pres, size=9,
                color=SLATE_500, italic=True, line=1.2)

    note_strip(s, M, y + 4.74, CW, 0.56,
               "every change in this repository was reviewed and merged by the whole "
               "team, but each area below has a single accountable owner for the "
               "hackathon presentation.",
               lead="How we worked:", fill=BLUE_LT, border=RGBColor(0xBF, 0xDB, 0xFE),
               lead_color=NAVY, fg=SLATE_600)

    footer(s, 12, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader) introduces the team.\n\n"
             "Four members, four owned areas. Then hand over: Chioma for the "
             "backend, Cynthia for the database, and Precious for testing and "
             "deployment.")
    return s


# ============================================================= SLIDE 13 ======
def slide_revenue(prs):
    s = new_slide(prs, bg=WHITE)
    y = header(s, "Revenue model", "The marketplace is already priced in the product",
               sub="Money is not yet moved by the platform — but the data needed to price it "
                   "correctly is already stored, validated and displayed.")
    presenter_tag(s, "Hephzibah Uchechukwu", "Team Leader · Revenue Model", y=0.40)

    lw = 6.15
    section_label(s, M, y + 0.36, lw, "Already implemented in the code")
    bullet_list(s, M, y + 0.70, lw, [
        ("Per-tutor pricing", "tutor_profiles.hourly_rate (NUMERIC, default ₦2,000) with currency = 'NGN' — set during signup and editable from the tutor profile form."),
        ("Live price estimate", "the modal displays hourly rate × duration. The API currently persists the tutor's hourly_rate as total_price, so the stored total is not duration-adjusted yet."),
        ("Budget as a matching input", "the directory exposes a ₦2,000–₦25,000 / hour filter and Smart Tutor Match treats the maximum hourly budget as a hard gate."),
        ("Admin metric", "the dashboard sums total_price for completed bookings. This is a gross booking-value proxy, not cash received by the platform."),
        ("Mode-aware sessions", "session_mode (online or in_person) is stored per booking, so future pricing can differ by delivery mode."),
    ], size=10.5, gap=0.15, marker=EMERALD)

    note_strip(s, M, y + 3.60, lw, 0.62,
               "no payment gateway, escrow, invoice or tutor payout is integrated. "
               "The platform does not charge or transfer money today.",
               lead="Not yet built:", fill=ROSE_LT, border=ROSE, lead_color=ROSE)

    rx = M + lw + 0.32
    rw = CW - lw - 0.32
    section_label(s, rx, y + 0.36, rw, "Proposed model (roadmap, not implemented)")
    plans = [
        ("Commission on completed sessions",
         "Future take-rate on completed sessions. First, calculate duration-based totals "
         "server-side and add a payment ledger.", EMERALD),
        ("Tutor subscription tiers",
         "Paid visibility for tutors — priority placement, extra profile media, booking "
         "analytics. verification_status and is_verified already gate public visibility.",
         BLUE),
        ("Parent premium plan",
         "Multi-child management, priority tutor matching and session reports. "
         "parent_profiles already models one child profile, age, level, budget and learning mode.",
         AMBER),
    ]
    cy = y + 0.70
    for i, (t, d, c) in enumerate(plans):
        h = 0.92
        card(s, rx, cy, rw, h, fill=SLATE_50, border=SLATE_200, radius=0.07)
        rect(s, rx, cy, 0.05, h, fill=c)
        text_at(s, rx + 0.22, cy + 0.11, rw - 0.44, 0.24, t, size=11.2,
                color=SLATE_900, bold=True, font=FONT_SB)
        text_at(s, rx + 0.22, cy + 0.38, rw - 0.44, 0.48, d, size=8.8,
                color=SLATE_600, line=1.16)
        cy += h + 0.09
    card(s, rx, cy, rw, 0.56, fill=NAVY, radius=0.07)
    text_at(s, rx + 0.22, cy + 0.08, rw - 0.44, 0.21,
            "Students and parents stay free", size=10.8, color=WHITE, bold=True,
            font=FONT_SB)
    text_at(s, rx + 0.22, cy + 0.30, rw - 0.44, 0.20,
            "Proposed supply-side monetisation; no subscription is currently charged.",
            size=8.5, color=RGBColor(0xCB, 0xD5, 0xE1))

    note_strip(s, M, y + 4.55, CW, 0.58,
               "commission, tiers and premium plans are proposals, not implemented revenue. "
               "The current admin tile is a booking-value proxy; no payment transactions are recorded.",
               lead="Accuracy note:", fill=AMBER_LT, border=AMBER, size=9.5)

    footer(s, 13, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader) — revenue model.\n\n"
             "Two halves. On the left, what is genuinely built: hourly rates, live "
             "naira estimates, budget filtering and an admin revenue metric over "
             "completed bookings. On the right, the proposed model — commission, "
             "tutor subscriptions and a parent premium plan — and an honest note "
             "that no money actually moves through the platform yet.")
    return s


# ============================================================= SLIDE 14 ======
def slide_value(prs):
    s = new_slide(prs, bg=SLATE_50)
    y = header(s, "Value, limitations & potential impact",
               "Impact, limits and next steps",
               sub="Judges should be able to trust the rest of this deck because of this slide.")

    cols = [
        ("Value delivered", EMERALD, [
            ("Verified supply", "only admin-approved tutors are ever listed, and every listing is read live from PostgreSQL."),
            ("Zero fabrication", "empty states instead of invented tutors, bookings or ratings — the data is always real."),
            ("Nigeria-specific", "36 states + FCT, naira pricing, and Nigerian / Cambridge / American curricula."),
            ("Complete lifecycle", "discover → verify → book → accept → teach → review, all inside one codebase."),
            ("Explainable matching", "every match carries a score and a human-readable reason."),
        ]),
        ("Current limitations", ROSE, [
            ("Dashboards are not server-protected", "there is no Next.js middleware yet; role checks live in the client and in the API."),
            ("No automated tests", "no Jest, Vitest or Playwright suite and no CI pipeline are committed."),
            ("No payments", "rates and prices are modelled, but no gateway, escrow or payout exists."),
            ("No notifications", "booking and review events are not pushed by email, SMS or WhatsApp."),
            ("Limited reach of the store", "credentials are stored as base64 data URLs, which is not a production file store."),
        ]),
        ("Potential impact", NAVY, [
            ("Subject coverage", "33 subject options across 8 curriculum areas, from WAEC/JAMB to coding and data analysis."),
            ("Nationwide reach", "state-level search plus a fully remote option for online-only tutors."),
            ("Tutor income", "a verified, professional profile with credentials and reviews — a digital storefront for teaching."),
            ("Parent confidence", "a documented trail: who taught what, when, at what price, and how it was rated."),
            ("Extensible base", "the schema already carries curriculum, teaching mode, documents and verification for future growth."),
        ]),
    ]
    colw = (CW - 2 * 0.26) / 3
    for i, (title, c, rows) in enumerate(cols):
        x = M + i * (colw + 0.26)
        card(s, x, y + 0.36, colw, 3.86, fill=WHITE, border=SLATE_200, radius=0.07)
        rect(s, x, y + 0.36, colw, 0.06, fill=c)
        text_at(s, x + 0.22, y + 0.58, colw - 0.44, 0.3, title, size=13,
                color=SLATE_900, bold=True, font=FONT_SB)
        cy = y + 1.02
        for k, v in rows:
            h = 0.20 + text_h(v, colw - 0.72, 9, 1.18)
            rect(s, x + 0.24, cy + 0.055, 0.10, 0.10, fill=c, radius=0.5)
            text_at(s, x + 0.46, cy - 0.015, colw - 0.70, 0.22, k, size=9.5,
                    color=SLATE_900, bold=True)
            text_at(s, x + 0.46, cy + 0.19, colw - 0.70, h - 0.2, v, size=9,
                    color=SLATE_600, line=1.18)
            cy += h + 0.115

    yb = y + 4.36
    section_label(s, M, yb, CW, "Next milestones we would ship first")
    chips = ["Server-side route protection with Next.js middleware",
             "Automated test suite + CI pipeline",
             "Payment, escrow and tutor payouts",
             "Email / WhatsApp notifications and a tutor earnings dashboard"]
    cwid = (CW - 3 * 0.16) / 4
    for i, t in enumerate(chips):
        x = M + i * (cwid + 0.16)
        chip(s, x, yb + 0.34, cwid, 0.58, t, fill=WHITE, fg=NAVY, size=9.5,
             radius=0.10, align=PP_ALIGN.CENTER)
        rect(s, x, yb + 0.34, cwid, 0.58, fill=None, line=SLATE_200, lw=1,
             radius=0.10)

    footer(s, 14, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader).\n\n"
             "Left: what the platform genuinely delivers today. Middle: the honest "
             "list of limitations — no server-side route protection, no automated "
             "tests, no payments, no notifications, and base64 document storage. "
             "Right: where it could go. The four chips at the bottom are our "
             "priority order.")
    return s


# ============================================================= SLIDE 15 ======
def slide_conclusion(prs):
    s = new_slide(prs, bg=WHITE)
    y = header(s, "Conclusion", "What we built — and what comes next",
               sub="A complete, deployed marketplace for verified Nigerian tutoring, "
                   "with every layer written by this team.")
    presenter_tag(s, "Hephzibah Uchechukwu", "Team Leader · Closing remarks", y=0.40)

    left = [
        ("A real product, not a mock-up", "15 routes, 21 components, 5 API routes, 10 database tables and a live deployment — all in this repository.", NAVY),
        ("Trust is designed in", "verification queue, verified badge, reviews bound to completed bookings, and a rating trigger that keeps the score honest.", EMERALD),
        ("Matching you can explain", "a deterministic rules engine that filters, scores, ranks and justifies every recommendation.", BLUE),
        ("A clean base to grow from", "the schema, the API and the component library are all documented and ready for the next feature.", AMBER),
    ]
    lw = 7.15
    cy = y + 0.40
    for t, d, c in left:
        h = 0.94
        card(s, M, cy, lw, h, fill=SLATE_50, border=SLATE_200, radius=0.07)
        rect(s, M, cy, 0.05, h, fill=c)
        text_at(s, M + 0.26, cy + 0.16, lw - 0.5, 0.28, t, size=12.5,
                color=SLATE_900, bold=True, font=FONT_SB)
        text_at(s, M + 0.26, cy + 0.47, lw - 0.5, 0.4, d, size=10,
                color=SLATE_600, line=1.2)
        cy += h + 0.12

    rx = M + lw + 0.32
    rw = CW - lw - 0.32
    grad_rect(s, rx, y + 0.40, rw, 3.02, c1=NAVY, c2=BLUE, angle=45, radius=0.05)
    text_at(s, rx + 0.30, y + 0.66, rw - 0.6, 0.3, "OUR NEXT STEP", size=10,
            color=EMERALD, bold=True, caps=True, spacing=1.2)
    text_at(s, rx + 0.30, y + 1.02, rw - 0.6, 0.8,
            "From a working platform to a trusted national service.",
            size=17, color=WHITE, bold=True, font=FONT_SB, line=1.1)
    for i, t in enumerate(["Protect the dashboards with server-side middleware",
                           "Automate testing and add CI to every pull request",
                           "Integrate payments, escrow and tutor payouts",
                           "Add WhatsApp and email notifications for every booking event"]):
        yy = y + 1.92 + i * 0.36
        rect(s, rx + 0.30, yy + 0.07, 0.11, 0.11, fill=EMERALD, radius=0.5)
        text_at(s, rx + 0.54, yy, rw - 0.86, 0.3, t, size=10,
                color=RGBColor(0xE0, 0xEA, 0xFF), line=1.16)

    note_strip(s, M, cy + 0.02, lw, 0.72,
               "TutorConnect Nigeria is open source under the MIT licence — the code, "
               "the schema and the design system are ready to be reused and extended.",
               lead="Open by design:", fill=BLUE_LT, border=RGBColor(0xBF, 0xDB, 0xFE),
               lead_color=NAVY, fg=SLATE_600)

    footer(s, 15, TOTAL)
    notes(s, "Hephzibah Uchechukwu (Team Leader) — closing remarks.\n\n"
             "Land four messages: this is a real product; trust is designed in; the "
             "matching is explainable; and the base is clean. Then name the four of "
             "us, thank the judges, and hand over to questions.")
    return s


# ============================================================= SLIDE 16 ======
def slide_thanks(prs):
    s = new_slide(prs, bg=NAVY_DK)
    picture_cover(s, "hero-tutor.jpg", 0, 0, SW, SH)
    ov = rect(s, -0.05, -0.05, SW + 0.1, SH + 0.1, fill=NAVY_DK,
              shape_type=MSO_SHAPE.RECTANGLE)
    set_alpha(ov, 16)
    ov2 = rect(s, -0.05, -0.05, SW + 0.1, SH + 0.1, fill=NAVY,
               shape_type=MSO_SHAPE.RECTANGLE)
    set_alpha(ov2, 30)
    rect(s, 0, 0, SW, 0.09, fill=BLUE)
    rect(s, SW * 0.58, 0, SW * 0.42, 0.09, fill=EMERALD)

    text_at(s, 0, 1.55, SW, 0.34, "EDUMENTRY AI HACKATHON 1.0", size=12,
            color=EMERALD, bold=True, align=PP_ALIGN.CENTER, caps=True, spacing=1.6)
    text_at(s, 0, 2.05, SW, 1.0, "THANK YOU", size=58, color=WHITE, bold=True,
            font=FONT_SB, align=PP_ALIGN.CENTER, line=1.0)
    rect(s, SW / 2 - 0.75, 3.20, 1.5, 0.055, fill=EMERALD)
    text_at(s, 0, 3.48, SW, 0.42, "Questions, feedback and collaboration are welcome",
            size=17, color=RGBColor(0xBF, 0xDB, 0xFE), align=PP_ALIGN.CENTER)
    text_at(s, 0, 3.95, SW, 0.34,
            "TutorConnect Nigeria  ·  A Tutor and Student Matching Platform",
            size=12, color=RGBColor(0xA9, 0xBE, 0xE8), align=PP_ALIGN.CENTER)

    band = rect(s, 0, 4.72, SW, 1.30, fill=NAVY_DK, shape_type=MSO_SHAPE.RECTANGLE)
    set_alpha(band, 22)
    line(s, 0, 4.72, SW, 4.72, color=RGBColor(0x3B, 0x52, 0x8F), width=1)
    team = [("Hephzibah Uchechukwu", "Team Leader"),
            ("Chioma Helen Ezeufonna", "Backend"),
            ("Uzochukwu Mary Cynthia Enyemakachukwu", "Database"),
            ("Bodman Ebuka Precious", "Deployment & QA")]
    tw = (SW - 1.7 - 3 * 0.16) / 4
    for i, (nm, role) in enumerate(team):
        x = 0.85 + i * (tw + 0.16)
        c = rect(s, x, 4.96, tw, 0.84, fill=RGBColor(0x14, 0x26, 0x50),
                 line=RGBColor(0x2E, 0x44, 0x80), lw=0.75, radius=0.10)
        set_alpha(c, 30)
        rect(s, x, 4.96, 0.05, 0.84, fill=[BLUE, EMERALD, AMBER, ROSE][i])
        text_at(s, x + 0.18, 5.10, tw - 0.34, 0.40, nm, size=10.5, color=WHITE,
                bold=True, line=1.1)
        text_at(s, x + 0.18, 5.50, tw - 0.34, 0.24, role, size=8.5,
                color=RGBColor(0xA9, 0xBE, 0xE8))

    text_at(s, 0, 6.28, SW, 0.3,
            "tutor-connect-ng.vercel.app     ·     github.com/zibahofficial/TutorConnectNg"
            "     ·     MIT Licensed",
            size=11, color=RGBColor(0x93, 0xA9, 0xD4), align=PP_ALIGN.CENTER)
    text_at(s, 0, 6.70, SW, 0.3,
            "Next.js 16  ·  React 19  ·  TypeScript  ·  Tailwind CSS 4  ·  "
            "Neon Serverless PostgreSQL  ·  JWT  ·  Vercel",
            size=9, color=RGBColor(0x7C, 0x93, 0xC2), align=PP_ALIGN.CENTER)

    notes(s, "All four members stand for Q&A.\n\n"
             "Thank the judges and the Edumentry AI Hackathon organisers. Keep the "
             "live URL and the repository on screen for anyone who wants to try it "
             "or read the code afterwards.")
    return s


# ================================================================== main =====
def main():
    prs = Presentation()
    prs.slide_width = Inches(SW)
    prs.slide_height = Inches(SH)

    slide_title(prs)
    slide_overview(prs)
    slide_problem(prs)
    slide_solution(prs)
    slide_journey(prs)
    slide_frontend(prs)
    slide_smart_match(prs)
    slide_backend(prs)
    slide_database(prs)
    slide_stack(prs)
    slide_qa(prs)
    slide_team(prs)
    slide_revenue(prs)
    slide_value(prs)
    slide_conclusion(prs)
    slide_thanks(prs)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    prs.save(OUT)
    print("Saved:", OUT)
    print("Slides:", len(prs.slides.__iter__.__self__._sldIdLst))


if __name__ == "__main__":
    main()
