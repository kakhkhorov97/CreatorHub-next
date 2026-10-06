// Decorative flags accompany the language names; the text remains the accessible label.
export default function LanguageFlag({ locale }: { locale: string }) {
	return (
		<svg className="language-flag" viewBox="0 0 36 24" aria-hidden="true" focusable="false">
			{locale === 'en' ? (
				<>
					<path fill="#fff" d="M0 0h36v24H0z" />
					{Array.from({ length: 7 }, (_, row) => (
						<path key={row} fill="#b22234" d={`M0 ${(row * 48) / 13}h36v${24 / 13}H0z`} />
					))}
					<path fill="#3c3b6e" d="M0 0h14.4v12.923H0z" />
					{Array.from({ length: 9 }, (_, row) =>
						Array.from({ length: row % 2 ? 5 : 6 }, (_, column) => (
							<path
								key={`${row}-${column}`}
								fill="#fff"
								transform={`translate(${1.2 + column * 2.4 + (row % 2 ? 1.2 : 0)} ${1.3 + row * 1.28})`}
								d="M0-.65.15-.2H.62L.24.08.38.53 0 .25-.38.53-.24.08-.62-.2h.47z"
							/>
						)),
					)}
				</>
			) : locale === 'uz' ? (
				<>
					<path fill="#0099b5" d="M0 0h36v8H0z" />
					<path fill="#fff" d="M0 8h36v8H0z" />
					<path fill="#1eb53a" d="M0 16h36v8H0z" />
					<path fill="#ce1126" d="M0 7.7h36v.6H0zM0 15.7h36v.6H0z" />
					<circle fill="#fff" cx="5.3" cy="4" r="2.6" />
					<circle fill="#0099b5" cx="6.2" cy="4" r="2.3" />
					{[3, 4, 5].map((count, row) =>
						Array.from({ length: count }, (_, column) => (
							<path
								key={`${row}-${column}`}
								fill="#fff"
								transform={`translate(${11 + (5 - count + column) * 2.1} ${1.9 + row * 2.1})`}
								d="M0-.65.15-.2H.62L.24.08.38.53 0 .25-.38.53-.24.08-.62-.2h.47z"
							/>
						)),
					)}
				</>
			) : (
				<>
					<path fill="#fff" d="M0 0h36v24H0z" />
					<g transform="rotate(-33.69 18 12)">
						<circle cx="18" cy="12" r="6" fill="#cd2e3a" />
						<path fill="#0047a0" d="M12 12a6 6 0 0 0 12 0a3 3 0 0 0-6 0a3 3 0 0 1-6 0" />
					</g>
					{[
						{ x: 7, y: 5, angle: -56.31, broken: [false, false, false] },
						{ x: 29, y: 5, angle: 56.31, broken: [true, false, true] },
						{ x: 7, y: 19, angle: 56.31, broken: [false, true, false] },
						{ x: 29, y: 19, angle: -56.31, broken: [true, true, true] },
					].map(({ x, y, angle, broken }) => (
						<g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle})`} fill="#111">
							{broken.map((split, row) => (
								<path
									key={row}
									d={
										split
											? `M-3 ${row * 1.5 - 2}h2.6v1H-3zM.4 ${row * 1.5 - 2}H3v1H.4z`
											: `M-3 ${row * 1.5 - 2}h6v1H-3z`
									}
								/>
							))}
						</g>
					))}
				</>
			)}
		</svg>
	);
}
