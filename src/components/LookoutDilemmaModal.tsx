import React, { useState } from 'react';
import { ShieldLetter, ShieldSkillState } from '../types/game';
import { sfx } from '../utils/sound';

interface LookoutDilemmaModalProps {
  skills: Record<ShieldLetter, ShieldSkillState>;
  onCompleteSkill: (letter: ShieldLetter, passed: boolean, score: number) => void;
  onFinishMission: () => void;
  onClose: () => void;
}

const STEP_ORDER: ShieldLetter[] = ['S', 'H', 'I', 'E', 'L', 'D'];

export const LookoutDilemmaModal: React.FC<LookoutDilemmaModalProps> = ({
  skills,
  onCompleteSkill,
  onFinishMission,
  onClose,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // S — Spot the Risk (checkbox multi-select: factual clues vs assumptions)
  const [sChecked, setSChecked] = useState<string[]>([]);

  // H — Hold Before Acting
  const [hChoice, setHChoice] = useState<string>('');

  // I — Identify the Influence (tactic + role)
  const [iTactic, setITactic] = useState<string>('');
  const [iRole, setIRole] = useState<string>('');

  // E — Evaluate Consequences (3 pairs)
  const [ePairs, setEPairs] = useState<Record<string, string>>({
    lookout: '',
    confront: '',
    refuse_help: '',
  });

  // L — Lead the Right Choice
  const [lChoice, setLChoice] = useState<string>('');

  // D — Defend Your Community (helper + 2 objective facts)
  const [dHelper, setDHelper] = useState<string>('');
  const [dFacts, setDFacts] = useState<string[]>([]);

  const isSummary = stepIdx >= STEP_ORDER.length;
  const currentLetter = STEP_ORDER[stepIdx];

  const handleToggleItem = (list: string[], setList: (v: string[]) => void, id: string) => {
    sfx.click();
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const submitCurrentStep = () => {
    if (currentLetter === 'S') {
      const factual = ['item_bag', 'no_scan', 'door_glance', 'jun_whisper'];
      const falseAlarms = ['definitely_stealing'];
      const hits = factual.filter((id) => sChecked.includes(id)).length;
      const alarms = falseAlarms.filter((id) => sChecked.includes(id)).length;
      const passed = hits >= 3 && alarms === 0;
      const score = Math.max(0, hits + (alarms === 0 ? 1 : 0));
      onCompleteSkill('S', passed, score);
      setFeedback(
        passed
          ? 'Cluepaw unlocked! You recorded visible facts without jumping to unverified accusations.'
          : 'Watch out for assumptions: stick strictly to observable facts (placed item, no scan, glancing at door, request) rather than assuming intent.'
      );
      passed ? sfx.success() : sfx.notify();
    } else if (currentLetter === 'H') {
      const passed = hChoice === 'refuse_calm';
      onCompleteSkill('H', passed, passed ? 1 : 0);
      setFeedback(
        passed
          ? 'Shieldfin unlocked! You set a safe, immediate boundary without escalating or joining in.'
          : 'Pause before acting: agreeing to watch the door creates complicity risk, while chasing or grabbing someone is unsafe.'
      );
      passed ? sfx.success() : sfx.notify();
    } else if (currentLetter === 'I') {
      const passed = iTactic === 'normalise_urgency' && iRole === 'lookout';
      const score = (iTactic === 'normalise_urgency' ? 1 : 0) + (iRole === 'lookout' ? 1 : 0);
      onCompleteSkill('I', passed, score);
      setFeedback(
        passed
          ? 'ByteBuddy unlocked! You spotted both the pressure tactic ("everyone does it / quick favour") and the lookout role requested.'
          : 'Check both parts: Jun tried to normalise it as a quick favour while asking you to take on the role of a lookout.'
      );
      passed ? sfx.success() : sfx.notify();
    } else if (currentLetter === 'E') {
      let score = 0;
      if (ePairs.lookout === 'complicity') score += 1;
      if (ePairs.confront === 'escalation') score += 1;
      if (ePairs.refuse_help === 'safe_outcome') score += 2;
      const passed = score >= 3;
      onCompleteSkill('E', passed, score);
      setFeedback(
        passed
          ? 'VeriFox unlocked! You mapped immediate actions to their delayed consequences accurately.'
          : 'Delayed Consequence Reminder: acting as a lookout can still carry legal/trust fallout, while confrontation risks escalation.'
      );
      passed ? sfx.success() : sfx.notify();
    } else if (currentLetter === 'L') {
      const passed = lChoice === 'respectful_redirect';
      onCompleteSkill('L', passed, passed ? 2 : 0);
      setFeedback(
        passed
          ? 'Echo unlocked! Respectful redirection protects both your friendship and safety without lecturing or mocking.'
          : 'Aim for a calm, respectful tone that declines the risk and offers a safe alternative like paying together or stepping outside.'
      );
      passed ? sfx.success() : sfx.notify();
    } else if (currentLetter === 'D') {
      const goodFacts = ['saw_item_bag', 'did_not_pay'];
      const factHits = goodFacts.filter((f) => dFacts.includes(f)).length;
      const badFact = dFacts.includes('he_is_criminal');
      const passed = dHelper === 'cashier' && factHits === 2 && !badFact;
      const score = (dHelper === 'cashier' ? 1 : 0) + (factHits === 2 && !badFact ? 1 : 0);
      onCompleteSkill('D', passed, score);
      setFeedback(
        passed
          ? 'Beacon unlocked! You alerted Sunshine Minimart staff calmly using clear, objective observations.'
          : 'Best approach: quietly inform the Sunshine Minimart cashier/trusted adult with strictly factual observations—avoid public shaming or filming.'
      );
      passed ? sfx.success() : sfx.notify();
    }
  };

  const advanceStep = () => {
    sfx.click();
    setFeedback(null);
    if (stepIdx + 1 >= STEP_ORDER.length) {
      setStepIdx(STEP_ORDER.length);
      onFinishMission();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const passedCount = STEP_ORDER.filter((l) => skills[l].passed).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12, 14, 22, 0.78)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="pixel-modal-frame pixel-scroll"
        style={{
          width: 'min(94vw, 680px)',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: 22,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            borderBottom: '2px solid rgba(200, 155, 103, 0.35)',
            paddingBottom: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#8de0cf' }}>
              SUNSHINE MINIMART • ANCHOR MISSION
            </div>
            <h2
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                color: '#f3c46b',
              }}
            >
              THE LOOKOUT DILEMMA
            </h2>
          </div>

          <button type="button" className="pixel-secondary-btn" onClick={onClose}>
            EXIT
          </button>
        </div>

        {/* S-H-I-E-L-D Progress Pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {STEP_ORDER.map((letter, idx) => {
            const st = skills[letter];
            const active = !isSummary && idx === stepIdx;
            return (
              <div
                key={letter}
                style={{
                  flex: '1 1 70px',
                  textAlign: 'center',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: active ? '2px solid #f3c46b' : '2px solid #231a16',
                  background: st.completed
                    ? st.passed
                      ? '#2f5e4d'
                      : '#63433b'
                    : active
                      ? '#3b4459'
                      : '#1b202b',
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  color: active ? '#f3c46b' : '#f4efe6',
                }}
              >
                {letter} {st.completed ? (st.passed ? '✓' : '!') : ''}
              </div>
            );
          })}
        </div>

        {/* Scenario Context Strip */}
        {!isSummary && (
          <div
            style={{
              background: '#1b202b',
              border: '2px solid #485063',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 14,
              lineHeight: 1.45,
              color: '#e6e0d6',
            }}
          >
            <strong style={{ color: '#f7e17c' }}>Scene:</strong> Inside{' '}
            <strong>Sunshine Minimart</strong>, your classmate <strong>Jun</strong> slips a snack
            packet into an open sling bag near the snack rack without going to the counter, glances
            at the cashier, and whispers:{' '}
            <em>&ldquo;Eh, can help me watch the door for two minutes? Quick one lah.&rdquo;</em>
          </div>
        )}

        {/* Active Step Content */}
        {currentLetter === 'S' && (
          <div>
            <h3 style={{ margin: '0 0 8px', color: '#f3c46b', fontSize: 16 }}>
              S — Spot the Risk (Factual Observation)
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#d0d7e3' }}>
              Select the <strong>strictly observable facts</strong> in the scene (avoid guesses or
              labelling intent):
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                ['item_bag', 'Jun placed a snack packet inside an open sling bag'],
                ['no_scan', 'No payment or scanning occurred at the counter'],
                ['door_glance', 'Jun glanced toward the cashier and shop entrance'],
                ['jun_whisper', 'Jun asked you to watch the door for two minutes'],
                ['definitely_stealing', 'Jun is definitely a habitual thief planning to steal daily'],
              ].map(([id, label]) => (
                <label
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: sChecked.includes(id) ? '#323c52' : '#1b202b',
                    border: sChecked.includes(id)
                      ? '2px solid #63b5a7'
                      : '2px solid #3c4356',
                    borderRadius: 8,
                    padding: '9px 12px',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sChecked.includes(id)}
                    onChange={() => handleToggleItem(sChecked, setSChecked, id)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentLetter === 'H' && (
          <div>
            <h3 style={{ margin: '0 0 8px', color: '#f3c46b', fontSize: 16 }}>
              H — Hold Before Acting (Safe Boundary)
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#d0d7e3' }}>
              What is your safest <strong>immediate response</strong> right now?
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                ['watch_door', 'Stand at the doorway to keep watch so Jun stays calm'],
                ['grab_bag', 'Snatch the bag away loudly and film Jun on your phone'],
                [
                  'refuse_calm',
                  'Pause and calmly decline: "No, I am not comfortable watching the door."',
                ],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setHChoice(id);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: hChoice === id ? '#344157' : '#1b202b',
                    border: hChoice === id ? '2px solid #f3c46b' : '2px solid #3c4356',
                    color: '#f5efe6',
                    fontSize: 14,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentLetter === 'I' && (
          <div>
            <h3 style={{ margin: '0 0 8px', color: '#f3c46b', fontSize: 16 }}>
              I — Identify the Influence
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#d0d7e3' }}>
              Identify <strong>both</strong> the persuasion tactic and the role requested of you:
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: '#8de0cf', marginBottom: 5 }}>
                  1. Pressure tactic used:
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {[
                    ['normalise_urgency', 'Minimising / urgency ("Just 2 mins, quick one lah")'],
                    ['official_order', 'Legal authority from store management'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setITactic(id);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        borderRadius: 7,
                        background: iTactic === id ? '#344157' : '#1b202b',
                        border: iTactic === id ? '2px solid #f3c46b' : '2px solid #3c4356',
                        color: '#f5efe6',
                        cursor: 'pointer',
                        fontSize: 13.5,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, color: '#8de0cf', marginBottom: 5 }}>
                  2. Role you are being asked to play:
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {[
                    ['lookout', 'Acting as a lookout (complicity in potential shop theft)'],
                    ['cashier_helper', 'Checking expiry dates for the minimart uncle'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setIRole(id);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        borderRadius: 7,
                        background: iRole === id ? '#344157' : '#1b202b',
                        border: iRole === id ? '2px solid #f3c46b' : '2px solid #3c4356',
                        color: '#f5efe6',
                        cursor: 'pointer',
                        fontSize: 13.5,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentLetter === 'E' && (
          <div>
            <h3 style={{ margin: '0 0 8px', color: '#f3c46b', fontSize: 16 }}>
              E — Evaluate Consequences (Delayed Consequence Engine)
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#d0d7e3' }}>
              Before seeing the outcome, match each action to its most likely consequence:
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                {
                  key: 'lookout',
                  action: 'Agreeing to watch the door',
                },
                {
                  key: 'confront',
                  action: 'Shouting & physically grabbing Jun',
                },
                {
                  key: 'refuse_help',
                  action: 'Refusing safely & informing staff calmly',
                },
              ].map((row) => (
                <div
                  key={row.key}
                  style={{
                    background: '#1b202b',
                    border: '2px solid #3c4356',
                    borderRadius: 8,
                    padding: '9px 12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{row.action}</span>
                  <select
                    value={ePairs[row.key]}
                    onChange={(e) => {
                      sfx.click();
                      setEPairs((prev) => ({ ...prev, [row.key]: e.target.value }));
                    }}
                    style={{
                      background: '#2b3244',
                      color: '#f5efe6',
                      border: '2px solid #231a16',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 13,
                    }}
                  >
                    <option value="">Select consequence...</option>
                    <option value="complicity">
                      Delayed complicity & legal/trust fallout
                    </option>
                    <option value="escalation">
                      Safety risk, public conflict or wrong accusation
                    </option>
                    <option value="safe_outcome">
                      Prevents harm safely without vigilantism
                    </option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentLetter === 'L' && (
          <div>
            <h3 style={{ margin: '0 0 8px', color: '#f3c46b', fontSize: 16 }}>
              L — Lead the Right Choice (Peer Redirection)
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#d0d7e3' }}>
              Pick a respectful message that nudges Jun towards a safer choice:
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                [
                  'shame',
                  '"You are embarrassing yourself, everyone is going to report you now!"',
                ],
                [
                  'respectful_redirect',
                  '"Don\'t risk it over a snack—put it back or let\'s pay together at the counter."',
                ],
                ['ignore_walk', '"Whatever, do what you want, just don\'t call my name."'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setLChoice(id);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: lChoice === id ? '#344157' : '#1b202b',
                    border: lChoice === id ? '2px solid #f3c46b' : '2px solid #3c4356',
                    color: '#f5efe6',
                    fontSize: 14,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentLetter === 'D' && (
          <div>
            <h3 style={{ margin: '0 0 8px', color: '#f3c46b', fontSize: 16 }}>
              D — Defend Your Community (Responsible Help-Seeking)
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#d0d7e3' }}>
              If concern remains unresolved, choose <strong>who to approach</strong> and{' '}
              <strong>two factual observations</strong> to share:
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  ['cashier', 'Sunshine Minimart Cashier / Trusted Adult'],
                  ['social_media', 'Post photo to neighbourhood Telegram chat'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setDHelper(id);
                    }}
                    style={{
                      flex: '1 1 200px',
                      padding: '9px 12px',
                      borderRadius: 7,
                      background: dHelper === id ? '#344157' : '#1b202b',
                      border: dHelper === id ? '2px solid #f3c46b' : '2px solid #3c4356',
                      color: '#f5efe6',
                      cursor: 'pointer',
                      fontSize: 13.5,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  ['saw_item_bag', 'Fact: An item from the snack aisle was placed in a sling bag'],
                  ['did_not_pay', 'Fact: The person has not gone to the counter yet'],
                  ['he_is_criminal', 'Label: Claiming they are definitely stealing for a gang'],
                ].map(([id, label]) => (
                  <label
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: dFacts.includes(id) ? '#323c52' : '#1b202b',
                      border: dFacts.includes(id)
                        ? '2px solid #63b5a7'
                        : '2px solid #3c4356',
                      borderRadius: 7,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 13.5,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={dFacts.includes(id)}
                      onChange={() => handleToggleItem(dFacts, setDFacts, id)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary / Ripple Debrief */}
        {isSummary && (
          <div>
            <h3 style={{ margin: '0 0 8px', color: '#8de0cf', fontSize: 17 }}>
              Delayed Consequence & Individual S.H.I.E.L.D. Breakdown
            </h3>
            <p style={{ fontSize: 14, color: '#e6e0d6', lineHeight: 1.5, marginTop: 0 }}>
              You completed <strong>The Lookout Dilemma</strong> ({passedCount}/6 individual
              competencies passed). Notice how each S.H.I.E.L.D. skill is scored independently—one
              good choice doesn&apos;t cover for another!
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {STEP_ORDER.map((l) => {
                const st = skills[l];
                return (
                  <div
                    key={l}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#1b202b',
                      border: `2px solid ${st.passed ? '#48a999' : '#85584a'}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#f3c46b', fontSize: 14 }}>
                        {st.letter} — {st.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#c4ccdc' }}>
                        Guardian: {st.guardianName} • {st.competency}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11,
                        color: st.passed ? '#7ce8be' : '#f29f8d',
                      }}
                    >
                      {st.passed ? 'PASS' : 'REVIEW'} ({st.score}/{st.maxScore})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback Banner */}
        {feedback && (
          <div
            style={{
              marginTop: 14,
              background: '#2c3548',
              border: '2px solid #f3c46b',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13.5,
              color: '#fff4dc',
              lineHeight: 1.45,
            }}
          >
            {feedback}
          </div>
        )}

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          {!isSummary && !feedback && (
            <button type="button" className="pixel-action-btn" onClick={submitCurrentStep}>
              SUBMIT {currentLetter} RESPONSE
            </button>
          )}
          {!isSummary && feedback && (
            <button type="button" className="pixel-action-btn" onClick={advanceStep}>
              {stepIdx + 1 >= STEP_ORDER.length ? 'VIEW RIPPLE SUMMARY' : 'NEXT SKILL →'}
            </button>
          )}
          {isSummary && (
            <button type="button" className="pixel-action-btn" onClick={onClose}>
              RETURN TO BLOCK 260
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
