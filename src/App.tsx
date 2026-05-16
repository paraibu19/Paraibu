/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import DoseCalculator from './components/DoseCalculator';
import InstallGuide from './components/InstallGuide';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <DoseCalculator />
      <InstallGuide />
    </div>
  );
}
